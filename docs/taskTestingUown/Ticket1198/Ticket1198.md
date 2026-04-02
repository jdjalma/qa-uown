---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1198

UOWN | Origination | Update Customer Application URLs

Synopsis
Update the customer application URLs sent during the application flow to use professional, market-standard domains and short identifiers for both UOWN and Kornerstone brands.

Business Objective
Today, when a customer starts an application, the system sends a link that is highly technical and not aligned with market standards.
This negatively impacts customer trust and perception, as the URL looks internal and non-professional.
By replacing the current technical URLs with clean, branded domains, the application flow becomes more professional, trustworthy, and consistent with industry practices, improving customer confidence and overall experience.

Feature Request | Business Requirements
Current Behavior
    During the application flow, customers receive a link similar to:
    originationprod.uownleasing.com/{LONG_UUID} 
    The identifier is long and technical.
    The domain name exposes internal environment details, which is not ideal for customer-facing communication.

New Expected Behavior
    Update application links to use clean, branded domains and short identifiers.
UOWN
* apply.uownleasing.com/{SHORT_CODE} 
Kornerstone
* apply.kornerstoneliving.com/{SHORT_CODE}


# Instruções de Teste – Integração Uown / Kornerstone

## 1. Objetivo

Garantir o correto funcionamento da integração e modernização do fluxo de aplicação entre a **Uown Leasing** e a fintech adquirida (**Kornerstone**), assegurando:

* Compatibilidade com **URLs antigas** (backward compatibility)
* Funcionamento correto das **novas URLs**
* Aplicação correta de **temas visuais por domínio**
* Envio correto de **templates de e-mail e SMS**, conforme o fluxo

## 2. Escopo

### Incluído

* Testes dos fluxos de aplicação:

  * `sendApplication`
  * `finalizeApplication`
  * `completeApplication`
* URLs antigas e novas
* Fluxo **Uown** e fluxo **Kornerstone**
* Validação de tema (branding) por domínio
* Validação de templates de **E-mail** e **SMS**

### Fora do escopo

* Testes de performance
* Testes de carga
* Integrações externas não relacionadas ao fluxo de aplicação

## 3. Pré-requisitos

* Ambiente disponível: DEV / QA / STAGING
* Lead válido cadastrado no sistema
* Lead contendo:

  * `uuid`
  * `shortCode`
* Feature flags de rebranding habilitadas (se aplicável)
* Serviço de envio de e-mail e SMS ativo

## 4. Modelos de URL

### 4.1 URLs Antigas (devem continuar funcionando)

* `origination-{env}.uowleansing.com/sendApplication?uuid={uuid}&paymentFrequency={frequency}`
* `origination-{env}.uowleansing.com/finalizeApplication?uuid={uuid}&paymentFrequency={frequency}`
* `origination-{env}.uowleansing.com/completeApplication?uuid={uuid}&paymentFrequency={frequency}`

### 4.2 URLs Novas

#### Fluxo Uown

* `apply-{env}.uowleansing.com/{shortCode}/send`
* `secure-{env}.uowleansing.com/{shortCode}/finalize`
* `secure-{env}.uowleansing.com/{shortCode}/complete`

#### Fluxo Kornerstone

* `apply-{env}.kornerstonecredit.com/{shortCode}/send`
* `secure-{env}.kornerstonecredit.com/{shortCode}/complete`

## 5. Temas e Branding

* O tema das telas **deve ser definido com base no domínio de acesso**
* Validar:

  * Logos
  * Cores primárias e secundárias
  * Identidade visual (Uown vs Kornerstone)
* O tema **não deve vazar** entre domínios diferentes

## 6. Templates de Comunicação – Kornerstone

### 6.1 Templates de E-mail

Devem ser testados e validados quanto a:

* Conteúdo correto
* Branding Kornerstone
* Links apontando para as **novas URLs**

Templates:

* `ApprovalEmail`
* `SendApplicationEmail`
* `DeclineEmail`
* `ActivationNotice`
* `Welcome`
* `InitialPaymentReminder`
* `FinalizePurchaseEmail`

### 6.2 Templates de SMS

* `SendApplication`
* `ApprovalMessage`
* `FinalizePurchase`

## 7. Cenários de Teste

### CT-01 – Send Application (URLs antigas)

**Fluxos:** Uown / Kornerstone

**Passos:**

1. Acessar a URL antiga de `sendApplication`
2. Informar `uuid` e `paymentFrequency`

**Resultado esperado:**

* Fluxo executado com sucesso
* Tela exibida corretamente
* Tema aplicado conforme domínio
* Comunicação enviada com template correto

---

### CT-02 – Send Application (URLs novas)

**Fluxos:** Uown / Kornerstone

**Passos:**

1. Acessar a nova URL usando `shortCode`

**Resultado esperado:**

* Fluxo executado com sucesso
* Tema correto aplicado
* Templates de e-mail/SMS corretos enviados

---

### CT-03 – Finalize Application

Validar:

* URLs antigas e novas
* Persistência correta do estado da aplicação
* Tema correto

---

### CT-04 – Complete Application

Validar:

* URLs antigas e novas
* Conclusão correta do fluxo
* Envio de comunicações finais

## 8. Critérios de Aceite

* Todas as URLs antigas continuam funcionais
* Novas URLs funcionam conforme esperado
* Temas corretos aplicados por domínio
* Leads recebem **somente** os templates correspondentes ao fluxo
* Nenhum erro em QA/STAGING

## 9. Observações

* Documento vivo, sujeito a ajustes conforme evolução da integração
* Atenção especial a regressões causadas por rebranding


---------------------------------------------------------------------------------------------------------------------------------------------------------


---

## UOWN | Origination | Atualizar URLs de Aplicação do Cliente

### Sinopse
Atualizar as URLs enviadas durante o fluxo de aplicação para usar domínios profissionais, padronizados e identificadores curtos para as marcas UOWN e Kornerstone.

### Objetivo de Negócio
Hoje os clientes recebem um link técnico com domínio interno e identificador longo, o que prejudica a confiança. Ao substituir por domínios limpos e brandeds, o fluxo fica mais profissional, confiável e alinhado ao mercado.

### Comportamento Atual
- URL recebida: `originationprod.uownleasing.com/{LONG_UUID}`
- Identificador longo e técnico
- Domínio expõe detalhes internos de ambiente

### Novo Comportamento Esperado
- URLs com domínios brandeds e identificadores curtos (short code)

#### UOWN
- `apply.uownleasing.com/{SHORT_CODE}`

#### Kornerstone
- `apply.kornerstoneliving.com/{SHORT_CODE}`

---

## Instruções de Teste – Integração Uown / Kornerstone

### 1. Objetivo
Garantir:
- Compatibilidade com URLs antigas (backward compatibility)
- Funcionamento das novas URLs
- Aplicação de temas visuais por domínio
- Envio correto de templates de e-mail e SMS conforme o fluxo

### 2. Escopo
**Incluído**
- Fluxos: `sendApplication`, `finalizeApplication`, `completeApplication`
- URLs antigas e novas
- Fluxos Uown e Kornerstone
- Tema/branding por domínio
- Templates de E-mail e SMS

**Fora do escopo**
- Performance
- Carga
- Integrações externas não relacionadas

### 3. Pré-requisitos
- Ambiente disponível: DEV / QA / STAGING
- Lead válido com `uuid` e `shortCode`
- Feature flags de rebranding habilitadas (se aplicável)
- Serviço de e-mail e SMS ativo

### 4. Modelos de URL

**4.1 URLs antigas (devem continuar funcionando)**
- `origination-{env}.uowleansing.com/sendApplication?uuid={uuid}&paymentFrequency={frequency}`
- `origination-{env}.uowleansing.com/finalizeApplication?uuid={uuid}&paymentFrequency={frequency}`
- `origination-{env}.uowleansing.com/completeApplication?uuid={uuid}&paymentFrequency={frequency}`

**4.2 URLs novas**

Fluxo Uown
- `apply-{env}.uowleansing.com/{shortCode}/send`
- `secure-{env}.uowleansing.com/{shortCode}/finalize`
- `secure-{env}.uowleansing.com/{shortCode}/complete`

Fluxo Kornerstone
- `apply-{env}.kornerstonecredit.com/{shortCode}/send`
- `secure-{env}.kornerstonecredit.com/{shortCode}/complete`

### 5. Temas e Branding
- Tema definido pelo domínio
- Validar: logos, cores primárias/segundárias, identidade visual (Uown vs Kornerstone)
- Tema não deve vazar entre domínios

### 6. Templates de Comunicação – Kornerstone

**6.1 E-mail (conteúdo correto, branding, links para novas URLs)**
- `ApprovalEmail`
- `SendApplicationEmail`
- `DeclineEmail`
- `ActivationNotice`
- `Welcome`
- `InitialPaymentReminder`
- `FinalizePurchaseEmail`

**6.2 SMS**
- `SendApplication`
- `ApprovalMessage`
- `FinalizePurchase`

### 7. Cenários de Teste

**CT-01 – Send Application (URLs antigas)**  
Passos: acessar URL antiga com `uuid` e `paymentFrequency`.  
Resultado: fluxo ok, tela correta, tema por domínio, template correto.

**CT-02 – Send Application (URLs novas)**  
Passos: acessar nova URL com `shortCode`.  
Resultado: fluxo ok, tema correto, e-mail/SMS corretos.

**CT-03 – Finalize Application**  
Validar URLs antigas e novas, persistência de estado e tema correto.

**CT-04 – Complete Application**  
Validar URLs antigas e novas, conclusão do fluxo e envio de comunicações finais.

### 8. Critérios de Aceite
- URLs antigas funcionam
- Novas URLs funcionam
- Temas corretos por domínio
- Leads recebem apenas os templates do fluxo
- Sem erros em QA/STAGING

### 9. Observações
- Documento vivo; ajustar conforme integração evoluir
- Atenção a regressões causadas por rebranding

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

src/main/java/com/uownleasing/common/pojo/LeadInfo.java



src/main/java/com/uownleasing/common/utils/Base36GeneratorUtils.java




src/main/java/com/uownleasing/los/common/db/repository/LeadRepo.java




src/main/java/com/uownleasing/los/common/service/LosLeadService.java



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





components/send-application-form/index.tsx
/* eslint-disable no-console */
import useNeuroid from '@components/neuro/useNeuroId';
import {PlaidBankVerificationComponent} from '@components/plaid-bank-verification';
import {VerifyPhoneNumber} from '@components/verify-phone-number';
import {SendApplicationRequest, SendApplicationResponse} from '@models';
import {CustomerStore} from '@stores/customer';
import {UtilityStore} from '@stores/utility';
import {
  cloneObject,
  convertNumberToCurrency,
  formatDate,
  showToast,
} from '@uownleasing/common-utilities';
import classNames from 'classnames';
import {useFormik} from 'formik';
import {inject, observer} from 'mobx-react';
import {CanContinueApplication} from 'models/can-continue-application';
import {useRouter} from 'next/router';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button} from 'react-bootstrap';
import {Container} from 'reactstrap';
import * as Yup from 'yup';
import styles from './index.module.scss';
import {default as getIovationFingerprint} from './iovation';
import CustomerInfoPanel from './panels/customer-information';
import DisclaimerPanel from './panels/disclaimer';
import EmploymentAndFinancialInformationPanel, {
  lengthOfEmploymentMapping,
  payScheduleMapping,
} from './panels/employment-and-financial-information';
import {GetServerSideProps} from 'next';
import {ProjectConfig} from '@config/project-config';

declare global {
  interface Window {
    nid: (a: string, b?: unknown, c?: unknown) => {};
    seon?: {
      init?: (cfg?: unknown) => void;
      getSession?: () => Promise<string>;
    };
  }
}

const defaultApplicationResponse = (): SendApplicationRequest => ({
  appUuid: '',
  emailAddress: '',
  mainAddress1: '',
  mainCellPhone: '',
  mainCity: '',
  mainCurrentOrFutureBankruptcy: false,
  mainDOB: '',
  mainEmployerName: null,
  mainEmploymentDuration: null,
  mainFirstName: '',
  mainMiddleName: '',
  mainLastName: '',
  mainLastPayDate: '',
  mainMonthlyIncome: 0,
  mainPayFrequency: '',
  mainPostalCode: '',
  mainSSN: '',
  merchantNumber: '',
  merchantName: '',
  iovationFingerprintText: '',
  seonFingerprintText: '',
  neuroIdentity: '',
  neuroSiteId: '',
  mainAddressVerified: false,
  mainBankAccountNumber: '',
  mainBankRoutingNumber: '',
  mainCreditCardBin: '',
});

const ApplicationResponsePanel = ({
  applicationResponse,
  applicationResponseCode,
  companyWebsite,
  utilityStore,
  leadPk,
}: {
  applicationResponse: SendApplicationResponse;
  applicationResponseCode: number;
  companyWebsite: string;
  utilityStore: UtilityStore;
  leadPk: number;
}) => {
  if (applicationResponseCode === 400) {
    return <ApplicationDeclinedPanel companyWebsite={companyWebsite} />;
  }
  if (applicationResponseCode !== 200) {
    console.debug(
      'send-application-form return an exception',
      applicationResponseCode,
    );
    return <ApplicationErrorPanel companyWebsite={companyWebsite} />;
  }
  if (applicationResponse.isPlaidRequired) {
    return (
      <PlaidBankVerificationComponent
        leadPk={leadPk}
        {...applicationResponse}
        utilityStore={utilityStore}
      />
    );
  }
  return <ApplicationSubmittedPanel {...applicationResponse} />;
};

const ResumePlaidVerificationPanel: React.FC<{
  leadPk: number;
  locationName: string;
  customerFirstName: string;
  utilityStore: UtilityStore;
  customerStore: CustomerStore;
  verifyPhone: boolean;
  config: ProjectConfig;
}> = ({
  leadPk,
  locationName,
  customerFirstName,
  utilityStore,
  customerStore,
  verifyPhone,
  config,
}) => {
  const [phoneVerified, setPhoneVerified] = useState<boolean>();
  if (verifyPhone && !phoneVerified) {
    return (
      <VerifyPhoneNumber
        leadPk={leadPk}
        setPhoneVerified={setPhoneVerified}
        verifyPhoneNumber={customerStore.verifyPhoneBeforeSigning}
        config={config}
      />
    );
  }
  return (
    <PlaidBankVerificationComponent
      leadPk={leadPk}
      locationName={locationName}
      customerFirstName={customerFirstName}
      utilityStore={utilityStore}
    />
  );
};

interface SendApplicationFormProps {
  utilityStore?: UtilityStore;
  customerStore?: CustomerStore;
  NID: string;
  activeApplicationStep: number;
  setActiveApplicationStep: (activeApplicationStep: number) => void;
  isSeonLoaded: boolean;
  setIsSeonLoaded: (isSeonLoaded: boolean) => void;
  isAnotherWindowOpen: boolean;
  RADAR_LICENSE_KEY: string;
  isKornerstone: boolean;
  config: ProjectConfig;
}

const SendApplicationForm = ({
  activeApplicationStep,
  setActiveApplicationStep,
  utilityStore,
  customerStore,
  isSeonLoaded,
  setIsSeonLoaded,
  isAnotherWindowOpen,
  NID,
  RADAR_LICENSE_KEY,
  isKornerstone,
  config,
}: SendApplicationFormProps) => {
  const router = useRouter();
  const ref = useRef(null);
  const [leadPk, setLeadPk] = useState<number>();
  const [applicationResponse, setApplicationResponse] =
    useState<SendApplicationResponse>();
  const [canContinueResp, setCanContinueResp] =
    useState<Partial<CanContinueApplication>>();

  const setAdditionFunnel = useCallback(() => {
    window.nid('start', {linkedSiteId: 'form_items340'});
    window.nid('setVariable', 'funnel', 'leadgen');
  }, []);

  useNeuroid({
    NID,
    identify: leadPk,
    setAdditionFunnel,
  });

  const [sendApplicationRequest, setSendApplicationRequest] =
    useState<SendApplicationRequest>(defaultApplicationResponse());
  const [applicationResponseCode, setApplicationResponseCode] = useState(-1);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const setShortCodeAndLoadAppStatus = useCallback(async () => {
    utilityStore.reset();
    // Remove on 1.50
    const uuid = router.query?.uuid || '';
    const shortCode = router.query?.shortCode || '';
    if (shortCode) {
      const shortCodeString = Array.isArray(shortCode)
        ? shortCode.join('')
        : shortCode;
      customerInfoFormik.setFieldValue('shortCode', shortCodeString);
      utilityStore.setUuid(shortCodeString);
      utilityStore.setIsLoading(true);
      const response = await utilityStore.canContinueApplication(
        '',
        shortCodeString,
      );
      utilityStore.setIsLoading(false);
      setCanContinueResp(response);
      setLeadPk(response.leadPk);
      customerInfoFormik.setFieldValue(
        'merchantNumber',
        response.refMerchantCode,
      );
      if (response.canContinuePlaid) {
        setActiveApplicationStep(4);
      } else if (response.canContinueApplication) {
        setActiveApplicationStep(0);
      } else {
        setActiveApplicationStep(-2);
      }
    }

    // Remove on 1.50
    if (uuid) {
      const uuidString = Array.isArray(uuid) ? uuid.join('') : uuid;
      customerInfoFormik.setFieldValue('appUuid', uuidString);
      utilityStore.setUuid(uuidString);
      utilityStore.setIsLoading(true);
      const response = await utilityStore.canContinueApplication(
        uuidString,
        '',
      );
      utilityStore.setIsLoading(false);
      setCanContinueResp(response);
      setLeadPk(response.leadPk);
      customerInfoFormik.setFieldValue(
        'merchantNumber',
        response.refMerchantCode,
      );
      if (response.canContinuePlaid) {
        setActiveApplicationStep(4);
      } else if (response.canContinueApplication) {
        setActiveApplicationStep(0);
      } else {
        setActiveApplicationStep(-2);
      }
    }
  }, [
    router.query?.uuid,
    router.query?.shortCode,
    setActiveApplicationStep,
    utilityStore,
  ]);

  const getSeonSessionData = async (): Promise<string> => {
    if (typeof window === 'undefined' || !window.seon?.getSession) {
      return '';
    }
    try {
      const seonSession = await window.seon.getSession();
      return seonSession || '';
    } catch {
      return '';
    }
  };

  const getSessionId = useCallback(async (): Promise<string> => {
    console.log('[SEON] getSessionId:start');

    try {
      const res = await customerStore?.getSessionId?.();
      console.log('[SEON] customerStore.getSessionId status =', res?.status);
    } catch (e) {
      console.error('[SEON] customerStore.getSessionId error', e);
    }

    if (typeof window === 'undefined') {
      console.warn('[SEON] window undefined (SSR)');
      return '';
    }

    const seon =
      ((window as any).seon as
        | {init?: () => void; getSession?: () => Promise<string>}
        | undefined) || undefined;

    if (!seon || typeof seon.getSession !== 'function') {
      console.warn('[SEON] SDK not loaded yet');
      return '';
    }

    try {
      try {
        typeof seon.init === 'function' && seon.init();
      } catch {}

      const t0 =
        typeof window !== 'undefined' &&
        window.performance &&
        typeof window.performance.now === 'function'
          ? window.performance.now()
          : Date.now();

      const session = await seon.getSession();

      const t1 =
        typeof window !== 'undefined' &&
        window.performance &&
        typeof window.performance.now === 'function'
          ? window.performance.now()
          : Date.now();

      const ms = Math.round(t1 - t0);

      console.log('[SEON] getSession: success', {
        len: session?.length ?? 0,
        ms,
      });

      setIsSeonLoaded(false);
      return session || '';
    } catch (e) {
      console.error('[SEON] getSession: error', e);
      return '';
    }
  }, [customerStore, setIsSeonLoaded]);

  const customerInfoFormik = useFormik({
    initialValues: {
      appUuid: '',
      shortCode: '',
      merchantNumber: '',
      mainFirstName: '',
      mainMiddleName: '',
      mainLastName: '',
      mainSuffix: '',
      mainSSN: '',
      mainDOB: '',
      mainCellPhone: '',
      emailAddress: '',
      mainAddress1: '',
      mainPostalCode: '',
      mainCity: '',
      mainStateOrProvince: '',
      mainAddressVerified: false,
    },
    validationSchema: Yup.object({
      mainFirstName: Yup.string().required('First Name is required.'),
      mainMiddleName: Yup.string().optional(),
      mainLastName: Yup.string().required('Last Name is required.'),
      mainSuffix: Yup.string().optional(),
      mainSSN: Yup.string()
        .length(9, 'SSN must be 9 digits long')
        .required('Social Security Number is required.'),
      mainDOB: Yup.string().required('Date of Birth is required.'),
      mainCellPhone: Yup.string().required('Mobile Phone is required.'),
      emailAddress: Yup.string()
        .matches(
          /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
          'Please enter a valid email address.',
        )
        .required('Email is required.'),
      mainAddress1: Yup.string().required('Street Address is required.'),
      mainPostalCode: Yup.string()
        .length(5, 'Zip Code must be 5 digits long.')
        .matches(/^\d*$/, 'ZIP codes must be numeric.')
        .required('Zip Code is required.'),
      mainCity: Yup.string().required('City is required.'),
      mainStateOrProvince: Yup.string(),
      mainAddressVerified: Yup.boolean(),
    }),
    onSubmit: async (values, {setSubmitting}) => {
      setSubmitting(true);
      const currentSendApplicationRequest: SendApplicationRequest = cloneObject(
        sendApplicationRequest,
      );
      Object.keys(values).forEach((field) => {
        const rawValue = values?.[field];
        let fieldValue = rawValue ?? '';
        const isMainDOB = field === 'mainDOB';
        if (isMainDOB) {
          fieldValue = formatDate({f: 'api', d: fieldValue});
        } else if (field === 'mainCellPhone') {
          fieldValue = fieldValue.replace(/\D/g, '');
        }
        currentSendApplicationRequest[field] =
          typeof fieldValue === 'string' ? fieldValue.trim() : fieldValue;
      });

      if ((currentSendApplicationRequest?.mainCellPhone || '').length !== 10) {
        showToast(
          'error',
          'US phone numbers must be numeric and exactly 10 digits long.',
        );
      } else {
        setSendApplicationRequest(currentSendApplicationRequest);
        setActiveApplicationStep(1);
      }
      setSubmitting(false);
    },
  });

  const employmentAndFinancialInfoFormik = useFormik({
    initialValues: {
      mainEmployerName: null,
      mainPayFrequency: '',
      mainLastPayDate: '',
      mainNextPayDate: '',
      mainMonthlyIncome: null,
      mainEmploymentDuration: null,
      mainBankAccountNumber: '',
      mainBankRoutingNumber: '',
      mainCreditCardBin: '',
    },
    validationSchema: Yup.object({
      mainPayFrequency: Yup.string().required('Your Pay Schedule is required.'),
      mainLastPayDate: Yup.string().required('Last Pay Date is required.'),
      mainNextPayDate: Yup.string().required('Next Pay Date is required.'),
      mainMonthlyIncome: Yup.number()
        .typeError(
          'Please use only numbers when providing your monthly income.',
        )
        .required('Gross Monthly Income is required.'),
      mainBankRoutingNumber: Yup.string()
        .matches(/^\d*$/, 'Routing number must be numeric.')
        .max(9, 'Routing number must be up to 9 digits.'),
      mainBankAccountNumber: Yup.string()
        .matches(/^\d*$/, 'Account number must be numeric.')
        .max(17, 'Account number must be up to 17 digits.'),
      mainCreditCardBin: Yup.string().matches(
        /^\d{0,6}$/,
        'Credit card bin must be numeric and up to 6 digits.',
      ),
    }),
    onSubmit: async (values, {setSubmitting}) => {
      setSubmitting(true);
      setActiveApplicationStep(2);
      const currentSendApplicationRequest: SendApplicationRequest = cloneObject(
        sendApplicationRequest,
      );

      const getMapKeyByValue = (mapping = {}, value = '') => {
        let keyToReturn = '';
        Object.keys(mapping).forEach((key) => {
          const currentKeyValue = mapping?.[key];
          if (currentKeyValue && currentKeyValue === value) {
            keyToReturn = key;
          }
        });
        return keyToReturn;
      };

      Object.keys(values).forEach((field = '') => {
        const isMainPayFrequency = field === 'mainPayFrequency';
        const isMainEmploymentDuration = field === 'mainEmploymentDuration';
        const isMainLastPayDate = field === 'mainLastPayDate';
        const isMainNextPayDate = field === 'mainNextPayDate';
        let valueToStore = values?.[field];
        if (isMainLastPayDate || isMainNextPayDate) {
          valueToStore = formatDate({f: 'api', d: valueToStore});
        } else if (isMainPayFrequency) {
          valueToStore = getMapKeyByValue(payScheduleMapping, valueToStore);
        } else if (isMainEmploymentDuration) {
          valueToStore = getMapKeyByValue(
            lengthOfEmploymentMapping,
            valueToStore,
          );
        }
        currentSendApplicationRequest[field] = valueToStore;
      });
      if (currentSendApplicationRequest.mainEmploymentDuration === '') {
        currentSendApplicationRequest.mainEmploymentDuration = null;
      }
      setSendApplicationRequest(currentSendApplicationRequest);
      setSubmitting(false);
    },
  });

  const disclaimerFormik = useFormik({
    initialValues: {
      mainCurrentOrFutureBankruptcy: '',
      isAgreedToStatements: false,
      isAgreedToPrivacyPolicy: false,
    },
    validationSchema: Yup.object({
      mainCurrentOrFutureBankruptcy: Yup.string().required(
        'Bankruptcy information is required.',
      ),
      isAgreedToStatements: Yup.boolean().required(
        'Your agreement to the aforementioned statements is required.',
      ),
      isAgreedToPrivacyPolicy: Yup.boolean().required(
        'Your agreement to the aforementioned statements is required.',
      ),
    }),
    onSubmit: async (values, {setSubmitting}) => {
      setSubmitting(true);
      const uuid: string =
        router.query?.uuid && typeof router.query?.uuid === 'string'
          ? router.query?.uuid
          : '';

      const shortCode: string =
        router.query?.shortCode && typeof router.query?.shortCode === 'string'
          ? router.query?.shortCode
          : '';
      utilityStore.setIsLoading(true);

      let response = await utilityStore.canContinueApplication(uuid, shortCode);

      if (response.canContinueApplication) {
        const {
          mainCurrentOrFutureBankruptcy = '',
          isAgreedToStatements,
          isAgreedToPrivacyPolicy,
        } = values;
        const isAllCheckboxClicked =
          isAgreedToStatements && isAgreedToPrivacyPolicy;
        const currentSendApplicationRequest: SendApplicationRequest =
          cloneObject(sendApplicationRequest);
        currentSendApplicationRequest.appUuid = response.uuid;

        currentSendApplicationRequest.mainCurrentOrFutureBankruptcy =
          mainCurrentOrFutureBankruptcy.toLowerCase() === 'yes';

        const iovationFingerPrint = await getIovationFingerprint();
        currentSendApplicationRequest.iovationFingerprintText =
          iovationFingerPrint || '';

        const seonSessionData = await getSeonSessionData();
        currentSendApplicationRequest.seonFingerprintText =
          seonSessionData || '';

        currentSendApplicationRequest.neuroIdentity = leadPk
          ? String(leadPk)
          : '';
        currentSendApplicationRequest.neuroSiteId = NID;
        if (mainCurrentOrFutureBankruptcy && isAllCheckboxClicked) {
          const sendApplicationResponse = await utilityStore.sendApplication(
            currentSendApplicationRequest,
          );

          const isPlaidRequired =
            sendApplicationResponse?.data?.isPlaidRequired ?? false;

          const applicationStatus =
            sendApplicationResponse?.data?.appApprovalStatus || '';

          window.nid('applicationSubmit');
          const isApplicationApproved =
            applicationStatus?.toUpperCase() === 'APPROVED';

          if (isApplicationApproved || isPlaidRequired) {
            setApplicationResponseCode(200);
          } else if (applicationStatus) {
            setApplicationResponseCode(400);
          } else {
            setApplicationResponseCode(500);
          }

          setApplicationResponse(sendApplicationResponse?.data);

          setActiveApplicationStep(3);
        } else if (!isAllCheckboxClicked) {
          showToast(
            'error',
            'Your agreement to the aforementioned statements is required.',
          );
        } else {
          showToast(
            'error',
            'Something went wrong. Please try reloading this page.',
          );
        }
      } else {
        setActiveApplicationStep(-2);
      }
      utilityStore.setIsLoading(false);
      setSubmitting(false);
    },
  });

  useEffect(() => {
    if (isSeonLoaded) {
      getSessionId();
    }
  }, [getSessionId, isSeonLoaded]);

  useEffect(() => {
    if (isAnotherWindowOpen) {
      setActiveApplicationStep(-3);
    } else {
      setShortCodeAndLoadAppStatus();
    }
  }, [
    // Remove on 1.50
    router.query?.uuid,
    router.query?.shortCode,
    isAnotherWindowOpen,
    setShortCodeAndLoadAppStatus,
    setActiveApplicationStep,
  ]);

  useEffect(() => {
    const isSubmitting =
      disclaimerFormik.isSubmitting ||
      employmentAndFinancialInfoFormik.isSubmitting ||
      customerInfoFormik.isSubmitting ||
      false;

    setIsFormSubmitting(isSubmitting);
  }, [
    customerInfoFormik.isSubmitting,
    disclaimerFormik.isSubmitting,
    employmentAndFinancialInfoFormik.isSubmitting,
  ]);

  useEffect(() => {
    const checkIsDisabled = async () => {
      if (isFormSubmitting) {
        setIsDisabled(true);
        return;
      }

      if (activeApplicationStep === 0 && !customerInfoFormik.isValid) {
        setIsDisabled(true);
        return;
      }

      if (activeApplicationStep === 1) {
        await employmentAndFinancialInfoFormik.validateForm();
        if (!employmentAndFinancialInfoFormik.isValid) {
          setIsDisabled(true);
          return;
        }
      }

      if (activeApplicationStep === 2) {
        await disclaimerFormik.validateForm();
        if (!disclaimerFormik.isValid) {
          setIsDisabled(true);
          return;
        }
      }

      setIsDisabled(false);
      return false;
    };
    checkIsDisabled();
  }, [
    isFormSubmitting,
    activeApplicationStep,
    disclaimerFormik.values,
    disclaimerFormik.isValid,
    customerInfoFormik.values,
    customerInfoFormik.isValid,
    employmentAndFinancialInfoFormik.values,
    employmentAndFinancialInfoFormik.isValid,
  ]);

  return (
    <div ref={ref} id={'applicationForm'}>
      <Container
        className={classNames('p-3 p-md-5', styles?.sendApplicationContainer)}
      >
        <div
          className={classNames(
            'mb-4',
            styles?.sendApplicationContainer__category,
          )}
        >
          {activeApplicationStep === 0 && 'Your Information'}
          {activeApplicationStep === 1 && 'Employment & Financial'}
          {activeApplicationStep === 2 && 'Legal & Disclaimer'}
        </div>
        {activeApplicationStep === -2 && (
          <ApplicationNotAvailablePanel companyWebsite={config.website} />
        )}
        {activeApplicationStep === -1 && <div>Loading...</div>}
        {activeApplicationStep === 0 && (
          <CustomerInfoPanel
            formik={customerInfoFormik}
            sendApplicationRequest={sendApplicationRequest}
            setSendApplicationRequest={setSendApplicationRequest}
            getStateForZipcode={customerStore?.getStateForZipcode}
            RADAR_LICENSE_KEY={RADAR_LICENSE_KEY}
          />
        )}
        {activeApplicationStep === 1 && (
          <EmploymentAndFinancialInformationPanel
            formik={employmentAndFinancialInfoFormik}
            sendApplicationRequest={sendApplicationRequest}
            setSendApplicationRequest={setSendApplicationRequest}
          />
        )}
        {activeApplicationStep === 2 && (
          <DisclaimerPanel
            formik={disclaimerFormik}
            isKornerstone={isKornerstone}
          />
        )}
        {activeApplicationStep === 3 && (
          <ApplicationResponsePanel
            utilityStore={utilityStore}
            companyWebsite={config.website}
            applicationResponse={applicationResponse}
            applicationResponseCode={applicationResponseCode}
            leadPk={leadPk}
          />
        )}
        {activeApplicationStep === 4 && (
          <ResumePlaidVerificationPanel
            leadPk={leadPk}
            locationName={canContinueResp.merchantLocationName}
            customerFirstName={canContinueResp.customerFirstName}
            utilityStore={utilityStore}
            customerStore={customerStore}
            verifyPhone={canContinueResp.verifyPhone}
            config={config}
          />
        )}
        {(isAnotherWindowOpen || activeApplicationStep === -3) && (
          <ApplicationAlreadyOpenPanel />
        )}
      </Container>

      {!isNaN(activeApplicationStep) &&
      activeApplicationStep >= 0 &&
      activeApplicationStep < 3 ? (
        <Container
          className={classNames(
            'd-flex w-100 justify-content-center justify-content-md-end mt-5 p-0',
            styles?.sendApplicationFooter,
          )}
        >
          {activeApplicationStep > 0 ? (
            <Button
              data-nid-target="sendApplication-PrevBtn"
              className={classNames(
                'bg-transparent text-uppercase px-5 mr-3',
                styles?.sendApplicationFooter__button,
              )}
              onClick={() => {
                const previousStep =
                  activeApplicationStep > 0 ? activeApplicationStep - 1 : 0;
                setActiveApplicationStep(previousStep);
              }}
            >
              Prev
            </Button>
          ) : (
            <></>
          )}
          <Button
            type="submit"
            form="new-application-form"
            data-nid-target={
              activeApplicationStep && activeApplicationStep === 2
                ? 'sendApplication-submitBtn'
                : 'sendApplication-nextBtn'
            }
            disabled={isDisabled}
            className={classNames(
              'text-uppercase px-5',
              styles?.sendApplicationFooter__button,
            )}
          >
            {activeApplicationStep && activeApplicationStep === 2
              ? 'Submit'
              : 'Next'}
          </Button>
        </Container>
      ) : (
        <></>
      )}
    </div>
  );
};

interface ApplicationNotAvailablePanelProps {
  companyWebsite: string;
}
const ApplicationNotAvailablePanel = ({
  companyWebsite,
}: ApplicationNotAvailablePanelProps) => {
  return (
    <div className={styles?.applicationPanel__container}>
      <div className={styles?.applicationPanel__title}>Sorry</div>

      <div
        className={classNames('mt-5', styles?.applicationPanel__description)}
      >
        Your application link has expired. Please reapply with a new link or the
        most recent link you received.
      </div>

      <div
        className={classNames('mt-3', styles?.applicationPanel__description)}
      >
        Please click{' '}
        <a href={companyWebsite} className={styles?.applicationPanel__link}>
          here
        </a>{' '}
        to access our home page.
      </div>
    </div>
  );
};

interface ApplicationSubmittedPanel extends SendApplicationResponse {}

const ApplicationSubmittedPanel = ({
  customerFirstName,
  locationName,
  creditLimit,
}: ApplicationSubmittedPanel) => {
  return (
    <div className={styles?.applicationPanel__container}>
      <div className={styles?.applicationPanel__title}>
        Congratulations, {customerFirstName}!
      </div>

      <div
        className={classNames('mt-5', styles?.applicationPanel__description)}
      >
        You have been approved for a {convertNumberToCurrency(creditLimit)}{' '}
        lease at {locationName}.
      </div>
      <div
        className={classNames('mt-3', styles?.applicationPanel__description)}
      >
        {locationName} will have record of your approval in their system and you
        are now able to complete your purchase.
      </div>
      <div
        className={classNames('mt-3', styles?.applicationPanel__description)}
      >
        A copy of this approval has been sent to your email address on file.
        Don't see it? Please check your SPAM folder.
      </div>
      <div
        className={classNames('mt-2', styles?.applicationPanel__description)}
      >
        A text message would be sent in the same time.
      </div>
    </div>
  );
};

interface ApplicationDeclinedPanelProps {
  companyWebsite: string;
}
export const ApplicationDeclinedPanel = ({
  companyWebsite,
}: ApplicationDeclinedPanelProps) => {
  return (
    <div className={styles?.applicationPanel__container}>
      <div className={styles?.applicationPanel__title}>
        Sorry, unfortunately your application is not accepted
      </div>

      <div
        className={classNames('mt-5', styles?.applicationPanel__description)}
      >
        Please click{' '}
        <a href={companyWebsite} className={styles?.applicationPanel__link}>
          here
        </a>{' '}
        to access our home page.
      </div>
    </div>
  );
};

interface ApplicationErrorPanelProps {
  companyWebsite: string;
}
const ApplicationErrorPanel = ({
  companyWebsite,
}: ApplicationErrorPanelProps) => {
  return (
    <div className={styles?.applicationPanel__container}>
      <div className={styles?.applicationPanel__title}>
        Something Went Wrong!
      </div>

      <div
        className={classNames('mt-5', styles?.applicationPanel__description)}
      >
        Please contact uown for assistance or click{' '}
        <a href={companyWebsite} className={styles?.applicationPanel__link}>
          here
        </a>{' '}
        to access our home page.
      </div>
    </div>
  );
};

const ApplicationAlreadyOpenPanel = () => {
  const isWindow: boolean = typeof window !== 'undefined';
  return (
    <div className={styles?.applicationPanel__container}>
      <div className={styles?.applicationPanel__title}>
        Your application is already open in another window. Click{' '}
        <a
          className="cursor-pointer text-info"
          onClick={() => isWindow && window.location.reload()}
        >
          here
        </a>{' '}
        to continue your application within this window.
      </div>

      <div
        className={classNames('mt-5', styles?.applicationPanel__description)}
      >
        If you believe you have received this message in error, please restart
        your browser and try again.
      </div>
    </div>
  );
};

type Props = {
  RADAR_LICENSE_KEY: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async () => ({
  props: {
    RADAR_LICENSE_KEY: process.env.RADAR_LICENSE_KEY || '',
  },
});

export default inject(
  'utilityStore',
  'customerStore',
)(observer(SendApplicationForm));





components/temp/finalizeApplication/index.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {UtilityStore} from '@stores/utility';
import {useRouter} from 'next/router';
import MissingDataPanel from '../../../components/missing-data-panel';
import NoAuthWrapper from '@layouts/no-auth';
import {
  convertNumberToCurrency,
  showToast,
} from '@uownleasing/common-utilities';
import {CustomerStore} from '@stores/customer';
import {handleKountSessionID} from '@utils/helper';
import VerificationMessage from '@components/verification-message';
import {MerchantStore} from '@stores/merchant';
import config from '@config/project-config';

interface FinalizeApplicationProps {
  merchantStore: MerchantStore;
  utilityStore: UtilityStore;
  customerStore: CustomerStore;
  isLocalhost: boolean;
  isProd: boolean;
  clientID: string;
  SENTRY_DSN: string;
  NID: string;
}

interface FinalApprovalDetails {
  maxApprovalAmount: number;
  merchantName: string[];
  customerFirstName: string;
  customerLastName: string;
  unapprovedMessage?: string;
}

interface FinalizeRequiredFields {
  leadPk: number;
  missingFields: string[];
  message?: string;
  welcomeMessageTitle: string;
  welcomeMessageBody: string;
}

export const FinalizeApplication = (props: FinalizeApplicationProps) => {
  const {customerStore, utilityStore, isProd, clientID, NID} = props;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, hasAnApiError] = useState<boolean>(false);
  const [currentLeadPk, setCurrentLeadPk] = useState<number>(null);
  const [finalApprovalDetails, setFinalApprovalDetails] =
    useState<FinalApprovalDetails | null>(null);
  const [finalizeRequiredFields, setFinalizeRequiredFields] =
    useState<FinalizeRequiredFields | null>(null);
  const [employmentHasBeenUpdated, setEmploymentHasBeenUpdated] =
    useState<boolean>(false);

  const changeLoadingStatus = useCallback(
    (status: boolean) => {
      utilityStore?.setIsLoading(status);
      setIsLoading(status);
    },
    [utilityStore],
  );

  const displayError = (message: string) => {
    showToast('error', message);
    hasAnApiError(true);
  };

  useEffect(() => {
    changeLoadingStatus(true);
  }, []);

  const initializeCustomerInfo = useCallback(
    async (leadPk: number) => {
      await customerStore?.setAccountPk(leadPk);
      await customerStore?.getEmploymentInfo(leadPk);
    },
    [customerStore],
  );

  const getFinalizeRequiredFields = useCallback(async () => {
    changeLoadingStatus(true);
    // Remove on 1.50
    const uuid = router?.query?.uuid || '';
    const shortCode = router?.query?.shortCode || '';
    const {data, message, status} =
      await utilityStore.getFinalizeApplicationFields(uuid, shortCode);
    if (status >= 400) {
      displayError(message);
      changeLoadingStatus(false);
      return;
    }
    setCurrentLeadPk(data.leadPk);
    await customerStore?.getEmploymentInfo(data.leadPk);
    setFinalizeRequiredFields({
      leadPk: data.leadPk,
      missingFields: data.missingFields,
      message: data.message,
      welcomeMessageBody: data.welcomeMessageBody,
      welcomeMessageTitle: data.welcomeMessageTitle,
    });
    await initializeCustomerInfo(data.leadPk);
    changeLoadingStatus(false);
  }, [
    router?.query?.uuid,
    router?.query?.shortCode,
    utilityStore,
    customerStore,
    initializeCustomerInfo,
    setCurrentLeadPk,
    changeLoadingStatus,
  ]);

  useEffect(() => {
    // Remove on 1.50
    const uuid = router?.query?.uuid;
    const shortCode = router?.query?.shortCode;
    if (uuid || shortCode) {
      getFinalizeRequiredFields();
    }
  }, [
    router?.query?.uuid,
    router?.query?.shortCode,
    changeLoadingStatus,
    getFinalizeRequiredFields,
  ]);

  const handleNext = useCallback(
    async (req: {
      lastPayDate: string;
      nextPayDate: string;
      payFrequency: string;
      employer: string;
    }) => {
      changeLoadingStatus(true);
      const response = await customerStore?.createOrUpdateEmployment({
        ...customerStore?.employmentInfo?.employmentInfo,
        lastPayDate:
          req?.lastPayDate ??
          customerStore?.employmentInfo?.employmentInfo.lastPayDate,
        nextPayDate:
          req?.nextPayDate ??
          customerStore?.employmentInfo?.employmentInfo.nextPayDate,
        payFrequency:
          req?.payFrequency ??
          customerStore?.employmentInfo?.employmentInfo.payFrequency,
        employer:
          req.employer ??
          customerStore?.employmentInfo?.employmentInfo.employer,
      });
      if (response) {
        displayError(response);
        changeLoadingStatus(false);
        return;
      }
      setEmploymentHasBeenUpdated(true);
      const {data, message, status} =
        await utilityStore.getFinalApprovalDetails(currentLeadPk);
      if (status >= 400) {
        displayError(message);
        changeLoadingStatus(false);
        return;
      }
      setFinalApprovalDetails(data);
      changeLoadingStatus(false);
    },
    [
      currentLeadPk,
      customerStore,
      utilityStore,
      setEmploymentHasBeenUpdated,
      changeLoadingStatus,
    ],
  );

  const getComponent = useCallback(() => {
    if (apiError) {
      return <></>;
    }

    if (finalizeRequiredFields.message) {
      return (
        <VerificationMessage
          title={finalizeRequiredFields.message}
          message={''}
        />
      );
    }

    if (
      finalizeRequiredFields.missingFields.length > 0 &&
      !employmentHasBeenUpdated
    ) {
      return (
        <MissingDataPanel
          missingFields={finalizeRequiredFields.missingFields}
          authorizeCreditCard={utilityStore?.authorizeCreditCard}
          achDiscount={utilityStore?.achDiscount || null}
          feeToBeCharged={utilityStore?.feeToBeCharged || null}
          securityDeposit={utilityStore?.securityDeposit || null}
          signingFeeExists={utilityStore?.signingFeeExists}
          submitApplication={handleNext}
          isLoading={utilityStore?.isLoading}
          setIsLoading={utilityStore?.setIsLoading}
          firstPayDate={utilityStore?.firstPaymentDate}
          utilityStore={utilityStore}
          isMissingPayDates
          handleKountSessionID={(formik, setSubmitted) =>
            handleKountSessionID(
              clientID,
              isProd,
              formik,
              undefined,
              setSubmitted,
            )
          }
          itemPaymentSummary={utilityStore?.itemPaymentSummary}
          leadPk={currentLeadPk}
          optionalAchText={[]}
          NID={NID}
          merchantRefCode={''}
          isFinalizeApplicationPage
          welcomeMessageTitle={finalizeRequiredFields.welcomeMessageTitle}
          welcomeMessageBody={finalizeRequiredFields.welcomeMessageBody}
          config={config}
        />
      );
    }

    if (finalApprovalDetails?.unapprovedMessage) {
      return (
        <VerificationMessage
          title={finalApprovalDetails.unapprovedMessage}
          message={''}
        />
      );
    }

    return (
      <VerificationMessage
        title={`Congratulations ${finalApprovalDetails?.customerFirstName}!`}
        message={`You have been approved for ${convertNumberToCurrency(
          finalApprovalDetails?.maxApprovalAmount,
        )} at ${finalApprovalDetails?.merchantName}.
                A copy of your approval has been sent to the email address and phone number on file. We have also notified ${
                  finalApprovalDetails?.merchantName
                } of your approval and you may now complete your purchase!`}
      />
    );
  }, [
    employmentHasBeenUpdated,
    finalApprovalDetails,
    NID,
    clientID,
    currentLeadPk,
    isProd,
    handleNext,
    utilityStore,
    apiError,
    finalizeRequiredFields,
  ]);

  return (
    <NoAuthWrapper isContactBarHidden={true} isNavbarShown={false}>
      {!utilityStore?.isLoading && !isLoading && (
        <div id="missingDataPanelContainer" className="h-100">
          <>{getComponent()}</>
        </div>
      )}
    </NoAuthWrapper>
  );
};




components/temp/sendApplication/index.module.scss
.sendApplication {
  background: var(--opaque-primary-color-background);
}




components/temp/sendApplication/index.tsx
import React, {useState, useEffect, useMemo} from 'react';
import {Stepper, Step} from 'react-form-stepper';
import classNames from 'classnames';
import styles from './index.module.scss';
import Script from 'next/script';
import {io} from 'socket.io-client';
import {loadKornerstoneTheme} from '@utils/helper';
import {ConnectorStyleProps} from 'react-form-stepper/dist/components/Connector/ConnectorTypes';
import {StepStyleDTO} from 'react-form-stepper/dist/components/Step/StepTypes';
import {projectConfig} from '@config/project-config';
import SendApplicationForm from '@components/send-application-form';
import SideNavLayout from '../../../layout/side-nav';

export const SendApplication = ({NID, RADAR_LICENSE_KEY}: Props) => {
  const [activeApplicationStep, setActiveApplicationStep] = useState(-1);
  const [isSeonLoaded, setIsSeonLoaded] = useState(false);
  const [isAnotherWindowOpen, setIsAnotherWindowOpen] = useState(false);
  const [isKornerstoneCustomer, setIsKornerstoneCustomer] = useState(false);
  const config = useMemo(
    () => projectConfig(isKornerstoneCustomer),
    [isKornerstoneCustomer],
  );

  useEffect(() => {
    setIsKornerstoneCustomer(loadKornerstoneTheme());
    const isWindow = typeof window !== undefined;
    const socket = io('', {
      path: '/socket.io',
      transports: ['websocket'],
      secure: true,
    });
    if (isWindow) {
      socket.emit('new tab', window.location.href);
    }

    // add param to obtain client data
    socket.on('new tab', () => {
      setIsAnotherWindowOpen(false);
    });
    socket.on('dup tab', () => {
      setIsAnotherWindowOpen(true);
    });
  }, []);

  const stepStyleConfigs = useMemo<{
    dto: StepStyleDTO;
    connector: ConnectorStyleProps;
  }>(() => {
    const commonStyle = {
      size: 50,
      circleFontSize: 20,
      labelFontSize: 16,
      borderRadius: 25,
      fontWeight: 100,
    };
    const commonStyleConnectors = {
      size: '3px',
      stepSize: '2em',
      style: 'solid',
    };
    return isKornerstoneCustomer
      ? {
          dto: {
            ...commonStyle,
            activeBgColor: '#86217f',
            activeTextColor: '#ffffff',
            completedBgColor: '#af7bab',
            completedTextColor: '#ffffff',
            inactiveBgColor: '#ffffff',
            inactiveTextColor: '#af7bab',
          },
          connector: {
            ...commonStyleConnectors,
            disabledColor: '#af7bab',
            activeColor: '#86217f',
            completedColor: '#86217f',
          },
        }
      : {
          dto: {
            ...commonStyle,
            activeBgColor: '#ffffff',
            activeTextColor: '#5bcbf5',
            completedBgColor: '#6d6a6a',
            completedTextColor: '#5bcbf5',
            inactiveBgColor: '#bbbbbb',
            inactiveTextColor: '#ffffff',
          },
          connector: {
            ...commonStyleConnectors,
            disabledColor: '#6d6a6a',
            activeColor: '#1895c4',
            completedColor: '#1895c4',
          },
        };
  }, [isKornerstoneCustomer]);

  return (
    <SideNavLayout isKornerstone={isKornerstoneCustomer} config={config}>
      <Script
        type="text/javascript"
        src="/iovation/config.js"
        strategy="afterInteractive"
      />
      <Script
        type="text/javascript"
        src="/iovation/loader.js"
        strategy="afterInteractive"
      />
      <Script
        type="text/javascript"
        src="https://cdn.deviceinf.com/js/v6/agent.umd.js"
        onLoad={() => {
          setIsSeonLoaded(true);
        }}
      />
      <div
        className={classNames(
          'p-0 pb-5 pb-md-5 p-md-5 min-vh-100',
          styles?.sendApplication,
        )}
      >
        <div className="text-uppercase mb-0 mb-md-5">
          <Stepper
            activeStep={activeApplicationStep}
            styleConfig={stepStyleConfigs.dto}
            connectorStyleConfig={stepStyleConfigs.connector}
          >
            <Step label="Your Info" className="cursor_initial" />
            <Step label="Employment" className="cursor_initial" />
            <Step label="Disclaimer" className="cursor_initial" />
          </Stepper>
        </div>

        <SendApplicationForm
          activeApplicationStep={activeApplicationStep}
          setActiveApplicationStep={setActiveApplicationStep}
          config={config}
          isSeonLoaded={isSeonLoaded}
          setIsSeonLoaded={setIsSeonLoaded}
          isAnotherWindowOpen={isAnotherWindowOpen}
          NID={NID}
          RADAR_LICENSE_KEY={RADAR_LICENSE_KEY}
          isKornerstone={isKornerstoneCustomer}
        />
      </div>
    </SideNavLayout>
  );
};

type Props = {
  NID: string;
  RADAR_LICENSE_KEY: string;
};




domain/stores/customer.tsx
import {makeObservable, observable, action} from 'mobx';
import {persist} from 'mobx-persist';
import {RootStore} from '@stores/root';
import {BaseStore} from '@stores/base';
import {
  ActivityLogRequest,
  ApprovalAmount,
  MerchantInformation,
  PaymentProgramData,
  Document,
  LeadInfo,
  Contract,
  Item,
  GetInvoiceInfoResponseType,
  SendFinalizeEmailBody,
  ChangeLeadStatusRequest,
  NewApplicationInfo,
  ActivityLogParams,
  PaginatedActivityLogs,
} from '@models';
import {
  PrimaryApplicant,
  PrimaryContact,
  EmploymentInformation,
  ThirdPartyInformation,
  PrimaryContactPanelDataCollection,
  PhoneListItem,
  Alert,
  SearchResult,
  ResponseType,
  SearchType,
  CreditCardProps,
  BankAccountProps,
  PaginatedResults,
  defaultPaginatedResp,
  ProtectionPlanInfo,
} from '@uownleasing/common-ui';
import {
  isEqual,
  getDate,
  formatDate,
  showToast,
  unformatPhoneAndCard,
  convertCurrencyToFloat,
} from '@uownleasing/common-utilities';
import axios, {CancelTokenSource} from 'axios';
import moment from 'moment';
import {Payments} from 'models/payments';
import {orderBy} from 'lodash';

export type AlertFilters = {
  from: string;
  to: string;
  message?: string;
  page: number;
  size: number;
  isDownload?: boolean;
};

export class CustomerStore extends BaseStore {
  @observable
  @persist
  accountPk: number = null;

  @observable
  @persist('list')
  quickSearchResults: SearchResult[] | undefined = undefined;

  @observable
  @persist('object')
  primaryCustomerInfo: PrimaryApplicant = undefined;

  @observable
  @persist
  isLoadingPrimaryCustomerInfo: boolean = null;

  @observable
  @persist('object')
  primaryCustomerContactInfo: PrimaryContact = undefined;

  @observable
  @persist
  isLoadingPrimaryCustomerContactInfo: boolean = null;

  @observable
  @persist('object')
  employmentInfo: EmploymentInformation = undefined;

  @observable
  @persist
  isLoadingEmploymentInfo: boolean = null;

  @observable
  @persist('object')
  thirdPartyContact: ThirdPartyInformation | undefined = undefined;

  @observable
  @persist('object', PaginatedActivityLogs)
  activityLogs: PaginatedActivityLogs = new PaginatedActivityLogs();

  @observable
  @persist
  isLoadingActivityLogs = null;

  @observable
  @persist('object')
  invoiceInfo: GetInvoiceInfoResponseType = undefined;

  @observable
  @persist
  isLoadingInvoiceInfo: boolean = null;

  @observable
  @persist('list')
  items: Item[] = [];

  @observable
  @persist('object')
  merchantInfo: MerchantInformation | undefined = undefined;

  @observable
  @persist
  isLoadingMerchantInfo: boolean = null;

  @observable
  @persist('object')
  creditCardProps: CreditCardProps | undefined = undefined;

  @observable
  @persist
  isLoadingCreditCardsProps: boolean = null;

  @observable
  @persist('object')
  bankAccountProps: BankAccountProps | undefined = undefined;

  @observable
  @persist
  isLoadingBankAccountProps: boolean = null;

  @observable
  @persist('object')
  leadInfo: LeadInfo = undefined;

  @observable
  @persist
  isLoadingLeadInfo: boolean = null;

  @observable
  @persist
  leadStatus: string = undefined;

  @observable
  @persist('list', Contract)
  contracts: Contract[] = [];

  @observable
  @persist
  isLoadingContracts: boolean = null;

  @observable
  @persist('object')
  alerts: PaginatedResults<Alert> = defaultPaginatedResp([]);

  @observable
  @persist('list')
  alertMessages: string[] = [];

  @observable
  @persist
  isLoadingAlert: boolean = null;

  @observable
  @persist
  lastReviewLog: string = undefined;

  @observable
  @persist
  lastReviewLogAccountPk: number = undefined;

  @observable
  @persist('list')
  paymentProgramData: PaymentProgramData[] = [];

  @observable
  @persist
  isShowingAlert: boolean = true;

  @observable
  @persist
  isLeaseModified: boolean = false;

  @observable
  @persist
  isAddNewInvoice: boolean = false;

  @observable
  @persist
  minimumLeaseAmount: number = undefined;

  @observable
  @persist
  reApprovalAmount: number = undefined;

  @observable
  @persist('list', Document)
  documents: Document[] = [];

  @observable
  @persist
  isLoadingDocument: boolean = null;

  @observable
  @persist('object')
  onGoingSearch: CancelTokenSource;

  @observable
  @persist
  redirectUrl: string;

  @observable
  @persist
  last3Payments: Payments[];

  @observable
  @persist
  isLoadingLast3Payments: boolean = null;

  @observable
  @persist
  allPayments: Payments[];

  @observable
  @persist
  isLoadingAllPayments: boolean = null;

  @observable
  @persist('list')
  visitedAccounts: string[] = [];

  @observable
  @persist
  protectionPlanInfo: ProtectionPlanInfo | undefined = undefined;

  @observable
  @persist
  isLoadingProtectionPlanInfo: boolean = null;

  constructor(rootStore: RootStore) {
    super(rootStore);
    makeObservable(this);
  }

  @action
  setAccountPk = (accountPk: number) => {
    this.reset();
    this.rootStore.documentStore.reset();
    this.accountPk = accountPk || null;
  };

  customerName = () => {
    const primaryInfo = this?.primaryCustomerInfo?.primaryCustomerInformation;
    const firstName = primaryInfo?.firstName || '';
    const middleName = primaryInfo?.middleName || '';
    const lastName = primaryInfo?.lastName || '';

    return [firstName, middleName, lastName].filter(Boolean).join(' ');
  };

  customerEmail = () => {
    const primaryContactInfo = this?.primaryCustomerContactInfo;
    const primaryEmailObject = primaryContactInfo?.leadEmails.find(
      (email) => (email?.emailInfo?.emailType || '') === 'PRIMARY',
    );
    return primaryEmailObject?.emailInfo?.emailAddress;
  };

  leadPk = () => {
    return (
      this?.primaryCustomerInfo?.primaryCustomerInformation?.leadPk || null
    );
  };

  @action
  setLeadInfo = (leadInfo: LeadInfo) => {
    this.leadInfo = leadInfo || undefined;
  };

  @action
  setIsLoadingLeadInfo = (loading: boolean) => {
    this.isLoadingLeadInfo = loading;
  };

  @action
  setLeadStatus = (leadStatus: string) => {
    this.leadStatus = leadStatus || '';
  };

  @action
  setMinimumLeaseAmount = (minimumLeaseAmount: number): void => {
    this.minimumLeaseAmount = minimumLeaseAmount;
  };

  @action
  getLeadInfo = async (leadPk: number): Promise<number> => {
    this.setIsLoadingLeadInfo(true);
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getLeadInfo/${leadPk}`,
    });
    const getLeadInfoResponseCode = (response && response.status) || 500;

    if (getLeadInfoResponseCode === 200 && response?.data) {
      this.setLeadInfo(response?.data);
    }

    this.setLeadStatus(response?.data?.leadStatus || 'Unknown');
    this.setIsLoadingLeadInfo(false);
    return getLeadInfoResponseCode;
  };

  @action
  setInvoiceInfo = (invoiceInfo: GetInvoiceInfoResponseType) => {
    this.invoiceInfo = invoiceInfo;
  };

  @action
  setIsLoadingInvoiceInfo = (loading: boolean) => {
    this.isLoadingInvoiceInfo = loading;
  };

  @action
  getInvoiceInfo = async (): Promise<number> => {
    this.setIsLoadingInvoiceInfo(true);
    const leadPk = this?.accountPk;
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getInvoiceInfo/${leadPk}`,
    });
    if (response && response.status === 200) {
      this.setInvoiceInfo(response?.data);
    }
    this.setIsLoadingInvoiceInfo(false);
    return (response && response.status) || 500;
  };

  @action
  getSimpleSearchResults = async (
    quickSearchRequest: string,
    pageNumber: string,
    searchType?: SearchType,
  ): Promise<ResponseType> => {
    const utilityStore = this?.rootStore?.utilityStore;

    const cancelToken = axios?.CancelToken;
    const source = cancelToken?.source();
    const prevOngoingSearch = this?.onGoingSearch;
    let wasCancelled = false;
    let type = searchType || '';
    const handleCancel = this?.onGoingSearch?.cancel;
    if (typeof this?.onGoingSearch !== 'undefined' && handleCancel) {
      handleCancel();
      wasCancelled = true;
    }
    if (searchType) {
      if (searchType === SearchType['Lead #']) {
        type = 'LeadPk';
      } else if (searchType === SearchType['Servicing Account #']) {
        type = 'AccountPk';
      } else if (searchType === SearchType['Invoice #']) {
        type = 'InvoiceNum';
      } else if (searchType === SearchType['Last 4 CC']) {
        type = 'last4CC';
      } else {
        type = searchType;
      }
    }
    const searchTypeQuery = searchType ? `&searchType=${type}` : '';

    this.onGoingSearch = source;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: `/uown/los/simpleSearch/${quickSearchRequest}?maxResults=100&pageNumber=${pageNumber}${searchTypeQuery}`,
      cancelToken: source?.token,
    });

    utilityStore?.setSearchType(searchType);

    if (response && response.status === 200) {
      this.setQuickSearchResults(response?.data?.searchResults || []);
    } else if (wasCancelled || !prevOngoingSearch) {
      response.data.wasCancelled = true;
    }
    return {
      message: response?.message || '',
      status: response?.status || 500,
      data: response?.data,
    };
  };

  @action
  setQuickSearchResults = (quickSearchResults: SearchResult[] = []): void => {
    this.quickSearchResults = quickSearchResults;
  };

  @action
  setPrimaryCustomerInfo = (primaryCustomerInfo: PrimaryApplicant) => {
    this.primaryCustomerInfo = primaryCustomerInfo;
  };

  @action
  setLoadingIsPrimaryCustomerInfo = (loading: boolean) => {
    this.isLoadingPrimaryCustomerInfo = loading;
  };

  @action
  getPrimaryCustomerInfo = async (accountPk: number) => {
    this.setLoadingIsPrimaryCustomerInfo(true);
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getPrimaryCustomerInfo/${accountPk}`,
    });
    if (response && response?.status === 200) {
      this.setPrimaryCustomerInfo(response?.data);
    }
    this.setLoadingIsPrimaryCustomerInfo(false);
    return this.primaryCustomerInfo;
  };

  @action
  setMerchantInfo = (merchantInfo: MerchantInformation) => {
    this.merchantInfo = merchantInfo;
  };

  @action
  setIsLoadingMerchantInfo = (loading: boolean) => {
    this.isLoadingMerchantInfo = loading;
  };

  @action
  getMerchantInfo = async (accountPk: number): Promise<number> => {
    this.setIsLoadingMerchantInfo(true);
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getMerchantInfo/${accountPk}`,
    });
    if (response && response.status === 200) {
      this.setMerchantInfo(response?.data);
    }
    this.setIsLoadingMerchantInfo(false);
    return (response && response.status) || 500;
  };

  @action
  createOrUpdatePrimaryCustomerInfo = async (
    primaryCustomerInfoRequest: PrimaryApplicant,
  ): Promise<number> => {
    const utilityStore = this?.rootStore?.utilityStore;

    const accountPk =
      primaryCustomerInfoRequest?.primaryCustomerInformation?.leadPk;
    const primaryCustomerInformation =
      primaryCustomerInfoRequest?.primaryCustomerInformation;
    if (primaryCustomerInformation) {
      const contactedPhone =
        primaryCustomerInfoRequest?.primaryCustomerInformation
          ?.lastContactedPhone;

      const coveredContactedPhone = unformatPhoneAndCard(contactedPhone || '');

      primaryCustomerInfoRequest.primaryCustomerInformation.lastContactedPhone =
        coveredContactedPhone;
    }
    utilityStore.setIsLoading(true);

    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/los/createOrUpdatePrimaryCustomerInfo',
      data: primaryCustomerInfoRequest,
    });

    // Refresh primary customer info.
    await this.getPrimaryCustomerInfo(accountPk);

    utilityStore.setIsLoading(false);

    return (response && response.status) || 500;
  };

  @action
  setEmploymentInfo = (employmentInfo: EmploymentInformation) => {
    this.employmentInfo = employmentInfo;
  };

  @action
  setIsLoadingEmploymentInfo = (loading: boolean) => {
    this.isLoadingEmploymentInfo = loading;
  };

  @action
  getEmploymentInfo = async (pk: number) => {
    this.setIsLoadingEmploymentInfo(true);
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getEmployment/${pk}`,
    });
    if (response && response.status === 200) {
      this.setEmploymentInfo(response?.data);
    }
    this.setIsLoadingEmploymentInfo(false);
    return (response && response.status) || 500;
  };

  @action
  createOrUpdateEmployment = async (
    createOrUpdateEmploymentRequest: EmploymentInformation['employmentInfo'],
  ): Promise<string> => {
    const utilityStore = this?.rootStore?.utilityStore;

    utilityStore.setIsLoading(true);

    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/los/createOrUpdateEmployment',
      data: createOrUpdateEmploymentRequest,
    });

    // Refresh primary customer info.
    await this.getEmploymentInfo(createOrUpdateEmploymentRequest?.customerPk);

    utilityStore.setIsLoading(false);

    const statusCode = (response && response.status) || 500;
    return statusCode === 200 ? '' : response?.message || 'Unexpected Error';
  };

  @action
  getThirdPartyContact = async () => {
    const accountPk = this.accountPk || null;
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/svc/getThirdPartyContact/${accountPk}`,
    });
    if (response && response.status === 200) {
      this.thirdPartyContact = response.data;
    } else {
      // Throw error
    }
    return (response && response?.status) || 500;
  };

  @action
  createOrUpdateThirdPartyContact = async (
    createOrUpdateThirdpartyRequest: ThirdPartyInformation,
  ): Promise<string> => {
    // TODO: fix this.
    createOrUpdateThirdpartyRequest.accountPk = this.accountPk;
    if (createOrUpdateThirdpartyRequest) {
      const clearPhoneNumber = unformatPhoneAndCard(
        createOrUpdateThirdpartyRequest?.phoneNumber,
      );
      createOrUpdateThirdpartyRequest.phoneNumber = clearPhoneNumber;
    }
    const utilityStore = this.rootStore?.utilityStore;
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/svc/createOrUpdateThirdPartyContact',
      data: createOrUpdateThirdpartyRequest,
    });

    await this.getThirdPartyContact();

    utilityStore?.setIsLoading(false);
    return (response && response?.message) || '';
  };

  @action
  createOrUpdateItem = async (
    createOrUpdateItemRequest: Item,
    isItemEdit: boolean,
    formik: any,
    values: Item['itemInfo'],
    oldBasePriceAmount: number,
    calculateTotalMerchAmount: (items: Item[]) => number,
  ): Promise<string> => {
    const {
      numberOfItems = 0,
      basePricePerItem = 0,
      itemDescription = '',
      itemCode = '',
    } = values || {};
    const items = formik?.values?.items || [];
    const totalAmount =
      numberOfItems * convertCurrencyToFloat(basePricePerItem);
    const totalOfMerchandiseAmount: number = calculateTotalMerchAmount(items);

    if (isItemEdit) {
      const sumOfMerchandiseAmount =
        totalOfMerchandiseAmount - oldBasePriceAmount + totalAmount;
      items?.map((item, index) => {
        const itemPk = item?.itemInfo?.itemPk || null;
        const itemId = item?.itemInfo?.['temp-id'] || null;
        const valuesId = values?.['temp-id'] || null;
        const hasItemPk = itemPk && values?.itemPk;
        if (hasItemPk && itemPk === values?.itemPk) {
          const itemInfoPath = `items[${index}].itemInfo`;
          formik?.setFieldValue(itemInfoPath, values);
          formik?.setFieldValue(
            `${itemInfoPath}.totalPricePerItem`,
            convertCurrencyToFloat(basePricePerItem || 0),
          );
          formik?.setFieldValue('merchandiseAmount', sumOfMerchandiseAmount);
        } else if (itemId && valuesId && itemId === valuesId) {
          values.totalPricePerItem = convertCurrencyToFloat(
            basePricePerItem || 0,
          );
          item.itemInfo = values;
          formik?.setFieldValue('merchandiseAmount', sumOfMerchandiseAmount);
        }
      });

      const message = 'Item has been successfully modified.';
      return message;
    } else {
      const newItem: Item = createOrUpdateItemRequest;
      newItem.itemInfo.numberOfItems = numberOfItems;
      newItem.itemInfo.basePricePerItem = basePricePerItem;
      newItem.itemInfo.totalPricePerItem = basePricePerItem;
      newItem.itemInfo.totalPriceForItems = totalAmount;
      newItem.itemInfo.itemDescription = itemDescription;
      newItem.itemInfo.itemCode = itemCode;
      newItem.itemInfo['temp-id'] = new Date().getTime();
      const allItems = formik?.values?.items?.concat(newItem);

      formik?.setFieldValue('items', allItems);

      const message = 'Item added successfully.';
      return message;
    }
  };

  @action
  createOrUpdateInvoiceInfo = async (
    createOrUpdateInvoiceInfoRequest: GetInvoiceInfoResponseType,
    isCreateInvoice: boolean,
  ): Promise<ResponseType> => {
    const utilityStore = this?.rootStore?.utilityStore;
    if (createOrUpdateInvoiceInfoRequest?.merchantInfo?.altContactPhone) {
      const altPhone =
        createOrUpdateInvoiceInfoRequest?.merchantInfo?.altContactPhone;
      createOrUpdateInvoiceInfoRequest.merchantInfo.altContactPhone =
        unformatPhoneAndCard(altPhone);
    }
    if (createOrUpdateInvoiceInfoRequest?.merchantInfo?.phoneNumber) {
      const phone = createOrUpdateInvoiceInfoRequest?.merchantInfo?.phoneNumber;
      createOrUpdateInvoiceInfoRequest.merchantInfo.phoneNumber =
        unformatPhoneAndCard(phone);
    }
    if (createOrUpdateInvoiceInfoRequest?.merchantInfo?.primaryContactPhone) {
      const primaryPhone =
        createOrUpdateInvoiceInfoRequest?.merchantInfo?.primaryContactPhone;
      createOrUpdateInvoiceInfoRequest.merchantInfo.primaryContactPhone =
        unformatPhoneAndCard(primaryPhone);
    }

    utilityStore.setIsLoading(true);

    const {items} = createOrUpdateInvoiceInfoRequest;
    (items || []).forEach(
      (item) =>
        item?.itemInfo?.['temp-id'] && delete item?.itemInfo?.['temp-id'],
    );

    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/los/createOrUpdateInvoiceInformation',
      data: createOrUpdateInvoiceInfoRequest,
    });
    const leadPk = this?.accountPk;
    await this.getInvoiceInfo();
    await this.getLeadInfo(leadPk);
    await this.getContracts(leadPk);

    if (
      response &&
      (response?.data?.status || response?.status) === 200 &&
      isCreateInvoice
    ) {
      let paymentResponse = await this.getPaymentOptions(leadPk);
      if (paymentResponse.status === 500) {
        const responseData: ResponseType = {
          status: (paymentResponse && paymentResponse.status) || 500,
          message:
            paymentResponse?.message || paymentResponse?.data?.error || '',
        };
        utilityStore.setIsLoading(false);
        return responseData;
      }
    }

    utilityStore.setIsLoading(false);
    const responseData: ResponseType = {
      status: (response && response.status) || 500,
      message: response?.message || response?.data?.error || '',
    };
    return responseData;
  };

  @action
  cancelLease = async (
    refundAllPayments: boolean = false,
    comment: string = '',
  ): Promise<ResponseType> => {
    if (!this.invoiceInfo?.items?.length) {
      return {
        status: 400,
        message: 'No items found to cancel.',
      };
    }

    const cancelledItems = this.invoiceInfo.items.map((item: Item) => {
      const updatedItem = {...item};
      if (updatedItem.itemInfo) {
        updatedItem.itemInfo = {
          ...updatedItem.itemInfo,
          status: 'CANCELLED',
        };
      }
      return updatedItem;
    });

    const createOrUpdateInvoiceInfoRequest: GetInvoiceInfoResponseType = {
      invoiceInfo: this.invoiceInfo.invoiceInfo,
      merchantInfo: this.invoiceInfo.merchantInfo,
      items: cancelledItems,
      refundPaymentsOnCancel: refundAllPayments,
      comment: comment,
    };

    return await this.createOrUpdateInvoiceInfo(
      createOrUpdateInvoiceInfoRequest,
      false,
    );
  };

  @action
  setPaymentFrequency = (paymentProgramData: PaymentProgramData[]) => {
    this.paymentProgramData = paymentProgramData;
  };

  @action
  getPaymentOptions = async (leadPk: number): Promise<ResponseType> => {
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/getPaymentOptionsForLead/${leadPk}`,
    });

    if (response && (response?.data?.status || response.status) === 200) {
      this.setPaymentFrequency(response?.data);
    }

    const responseData: ResponseType = {
      status: (response && response.status) || 500,
      message: response?.message || response?.data?.error || '',
    };

    return responseData;
  };

  @action
  sendFinalizeEmailToCustomer = async (
    redirectUrl: string,
    leadPk: number,
  ): Promise<ResponseType> => {
    const requestBody: SendFinalizeEmailBody = {
      leadPk,
      redirectUrl,
    };
    const utilityStore = this?.rootStore?.utilityStore;
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/sendFinalizeEmailToCustomer',
      data: requestBody,
    });
    utilityStore?.setIsPaymentProgramModalOpen(false);
    await this.getContracts(leadPk);
    utilityStore?.setIsLoading(false);
    const responseData: ResponseType = {
      status: (response && response.status) || 500,
      message: response?.message,
    };
    return responseData;
  };

  @action
  setActivityLogs = (activityLogs: PaginatedActivityLogs) => {
    this.activityLogs = activityLogs;
  };

  @action
  setIsLoadingActivityLogs = (state: boolean) => {
    this.isLoadingActivityLogs = state;
  };

  @action
  getActivityLogs = async (
    leadPk: number,
    {
      logTypes = [],
      notes = '',
      createdBy = '',
      page = 0,
      size = 10,
    }: ActivityLogParams = {},
  ): Promise<PaginatedActivityLogs> => {
    this.setIsLoadingActivityLogs(true);
    const utilityStore = this.rootStore?.utilityStore;
    const {status: statusCode = 500, data} = await utilityStore?.sendRequest({
      method: 'POST',
      url: `/uown/los/getLogsForLead/${
        leadPk || this.leadPk() || this.accountPk
      }`,
      data: {
        page,
        size,
        logTypes,
        notes,
        createdBy,
      },
    });
    if (statusCode === 200) {
      this.setActivityLogs(data || new PaginatedActivityLogs());
    }
    this.setIsLoadingActivityLogs(false);
    return this.activityLogs;
  };

  @action
  setLastReviewLog = (lastReviewLog: string) => {
    this.lastReviewLog = lastReviewLog;
  };

  @action
  setLastReviewLogAccountPk = (lastReviewLogAccountPk: number) => {
    this.lastReviewLogAccountPk = lastReviewLogAccountPk;
  };

  @action
  createOrUpdateLog = async (createOrUpdateLogRequest: ActivityLogRequest) => {
    const utilityStore = this?.rootStore?.utilityStore;

    const isReviewLog = (createOrUpdateLogRequest?.logType || '') === 'REVIEW';
    const nowMoment = moment();
    const lastReviewLogMoment = moment(this?.lastReviewLog || '').toISOString();
    const durationSinceLastReviewLog =
      this?.lastReviewLog &&
      moment.duration(nowMoment.diff(lastReviewLogMoment));
    const durationAsMinutes =
      durationSinceLastReviewLog && durationSinceLastReviewLog?.asMinutes();

    const accountPk = this?.accountPk || null;

    if (
      !isReviewLog ||
      (isReviewLog && !lastReviewLogMoment) ||
      (isReviewLog && durationAsMinutes && durationAsMinutes > 5) ||
      (accountPk && accountPk !== this.lastReviewLogAccountPk)
    ) {
      const response = await utilityStore?.sendRequest({
        method: 'POST',
        url: '/uown/los/createOrUpdateLog',
        data: createOrUpdateLogRequest,
      });

      if (response && response.status === 200) {
        if (isReviewLog) {
          this.setLastReviewLog(moment().toISOString());
          this.setLastReviewLogAccountPk(accountPk);
        }
      }

      const responseData: ResponseType = {
        status: (response && response.status) || 500,
        message: response?.message,
      };
      return responseData;
    }
  };

  @action
  setPrimaryCustomerContactInfo = (
    primaryCustomerContactInfo: PrimaryContact,
  ) => {
    this.primaryCustomerContactInfo = primaryCustomerContactInfo;
  };

  @action
  setIsLoadingPrimaryCustomerContactInfo = (loading: boolean) => {
    this.isLoadingPrimaryCustomerContactInfo = loading;
  };

  @action
  getPrimaryCustomerContactInfo = async (accountPk: number) => {
    this.setIsLoadingPrimaryCustomerContactInfo(true);
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getPrimaryCustomerContactInfo/${accountPk}`,
    });
    const responseCode = (response && response?.status) || 500;
    if (responseCode === 200) {
      this.setPrimaryCustomerContactInfo(response?.data);
    }
    this.setIsLoadingPrimaryCustomerContactInfo(false);
    return this.primaryCustomerContactInfo;
  };

  @action
  changePrimaryCustomerContactInfo = async (
    data: PrimaryContact,
  ): Promise<number> => {
    const utilityStore = this?.rootStore?.utilityStore;
    // @ts-ignore // TODO: FIX
    const leadPk = data?.leadPk;

    utilityStore.setIsLoading(true);

    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/los/createOrUpdatePrimaryCustomerContactInfo',
      data: data,
    });
    // Refresh primary customer contact info.
    await this.getPrimaryCustomerContactInfo(leadPk);
    utilityStore.setIsLoading(false);

    return (response && response.status) || 500;
  };

  @action
  createOrUpdatePrimaryCustomerContactInfo = async (
    primaryCustomerContactInfoRequest: PrimaryContactPanelDataCollection,
  ) => {
    const request: PrimaryContact = this.primaryCustomerContactInfo;
    if (primaryCustomerContactInfoRequest?.mobilePhoneNumber) {
      const mobilePhone = primaryCustomerContactInfoRequest?.mobilePhoneNumber;
      primaryCustomerContactInfoRequest.mobilePhoneNumber =
        unformatPhoneAndCard(mobilePhone);
    }
    if (primaryCustomerContactInfoRequest?.homePhoneNumber) {
      const homePhone = primaryCustomerContactInfoRequest?.homePhoneNumber;
      primaryCustomerContactInfoRequest.homePhoneNumber =
        unformatPhoneAndCard(homePhone);
    }
    if (primaryCustomerContactInfoRequest?.workPhoneNumber) {
      const workPhone = primaryCustomerContactInfoRequest?.workPhoneNumber;
      primaryCustomerContactInfoRequest.workPhoneNumber =
        unformatPhoneAndCard(workPhone);
    }

    const primaryEmailObject = request?.leadEmails?.find(
      (email) => (email?.emailInfo?.emailType || '') === 'PRIMARY',
    );
    const primaryEmailObjectIndex =
      request?.leadEmails?.indexOf(primaryEmailObject);

    const mobilePhoneObject = request?.leadPhones?.find(
      (phone) => (phone?.phoneInfo?.phoneType || '') === 'MOBILE',
    );
    const mobilePhoneObjectIndex =
      request?.leadPhones?.indexOf(mobilePhoneObject);
    const workPhoneObject = request?.leadPhones?.find(
      (phone) => (phone?.phoneInfo?.phoneType || '') === 'WORK',
    );
    const workPhoneObjectIndex = request?.leadPhones?.indexOf(workPhoneObject);
    const homePhoneObject = request?.leadPhones?.find(
      (phone) => (phone?.phoneInfo?.phoneType || '') === 'HOME',
    );
    const homePhoneObjectIndex = request?.leadPhones?.indexOf(homePhoneObject);

    if (
      request?.leadAddresses &&
      request?.leadAddresses[0] &&
      request?.leadAddresses[0].addressInfo
    ) {
      request.leadAddresses[0].addressInfo.streetAddress1 =
        primaryCustomerContactInfoRequest?.streetAddress1;
      request.leadAddresses[0].addressInfo.streetAddress2 =
        primaryCustomerContactInfoRequest?.streetAddress2;
      request.leadAddresses[0].addressInfo.city =
        primaryCustomerContactInfoRequest?.city;
      request.leadAddresses[0].addressInfo.state =
        primaryCustomerContactInfoRequest?.state;
      request.leadAddresses[0].addressInfo.zipCode =
        primaryCustomerContactInfoRequest?.zip;
    }

    if (
      request?.leadEmails &&
      request?.leadEmails[primaryEmailObjectIndex] &&
      request?.leadEmails[primaryEmailObjectIndex]?.emailInfo
    ) {
      request.leadEmails[primaryEmailObjectIndex].emailInfo.emailAddress =
        primaryCustomerContactInfoRequest?.primaryEmail;
      request.leadEmails[primaryEmailObjectIndex].emailInfo.doNotEmail =
        primaryCustomerContactInfoRequest?.doNotEmailPrimary;
      request.leadEmails[primaryEmailObjectIndex].emailInfo.reasonForDnc =
        primaryCustomerContactInfoRequest?.doNotEmailPrimaryReason;
    }

    if (
      primaryCustomerContactInfoRequest?.mobilePhoneNumber &&
      primaryCustomerContactInfoRequest?.mobilePhoneNumber.length > 3
    ) {
      if (request?.leadPhones?.[mobilePhoneObjectIndex]) {
        primaryCustomerContactInfoRequest?.mobilePhoneNumber.length > 3
          ? (request.leadPhones[mobilePhoneObjectIndex].phoneInfo.areaCode =
              primaryCustomerContactInfoRequest?.mobilePhoneNumber.substring(
                0,
                3,
              ))
          : '',
          primaryCustomerContactInfoRequest?.mobilePhoneNumber.length > 3
            ? (request.leadPhones[
                mobilePhoneObjectIndex
              ].phoneInfo.phoneNumber = parseInt(
                primaryCustomerContactInfoRequest?.mobilePhoneNumber.substring(
                  3,
                ),
                10,
              ))
            : null,
          (request.leadPhones[mobilePhoneObjectIndex].phoneInfo.phonePK =
            request?.leadPhones[mobilePhoneObjectIndex]?.phoneInfo?.phonePK ||
            0),
          (request.leadPhones[mobilePhoneObjectIndex].phoneInfo.doNotCall =
            primaryCustomerContactInfoRequest?.doNotCallMobile),
          (request.leadPhones[mobilePhoneObjectIndex].phoneInfo.doNotText =
            primaryCustomerContactInfoRequest?.doNotTextMobile),
          (request.leadPhones[mobilePhoneObjectIndex].phoneInfo.reasonForDnc =
            primaryCustomerContactInfoRequest?.doNotCallMobileReason),
          (request.leadPhones[mobilePhoneObjectIndex].phoneInfo.phoneType =
            'MOBILE'),
          (request.leadPhones[mobilePhoneObjectIndex].phoneInfo.reasonForDnt =
            primaryCustomerContactInfoRequest?.doNotTextMobileReason);
      } else {
        const borrowerPK =
          request?.leadPhones?.[0]?.phoneInfo?.borrowerPK || null;
        const {
          mobilePhoneNumber,
          doNotCallMobile,
          doNotTextMobile,
          doNotCallMobileReason = '',
          doNotTextMobileReason = '',
        } = primaryCustomerContactInfoRequest || {};
        const areaCode =
          mobilePhoneNumber?.length > 3
            ? mobilePhoneNumber?.substring(0, 3)
            : '';
        const workNumber =
          mobilePhoneNumber?.length > 3
            ? parseInt(mobilePhoneNumber.substring(3), 10)
            : null;

        const mobilePhone: PhoneListItem = {
          pk: null,
          rowCreatedTimestamp: '',
          rowUpdatedTimestamp: '',
          tenantId: '',
          webUserId: '',
          phoneInfo: {
            phonePK: null,
            borrowerPK: borrowerPK,
            phoneType: 'MOBILE',
            areaCode: areaCode,
            phoneNumber: workNumber,
            phoneExtension: 0,
            doNotCall: doNotCallMobile,
            reasonForDnc: doNotCallMobileReason,
            doNotText: doNotTextMobile,
            reasonForDnt: doNotTextMobileReason,
            lastContactTimestamp: '',
          },
        };
        request?.leadPhones?.push(mobilePhone);
      }
    }

    if (
      primaryCustomerContactInfoRequest?.workPhoneNumber &&
      primaryCustomerContactInfoRequest?.workPhoneNumber.length > 3
    ) {
      if (request?.leadPhones[workPhoneObjectIndex]) {
        primaryCustomerContactInfoRequest?.workPhoneNumber.length > 3
          ? (request.leadPhones[workPhoneObjectIndex].phoneInfo.areaCode =
              primaryCustomerContactInfoRequest?.workPhoneNumber.substring(
                0,
                3,
              ))
          : '',
          primaryCustomerContactInfoRequest?.workPhoneNumber.length > 3
            ? (request.leadPhones[workPhoneObjectIndex].phoneInfo.phoneNumber =
                parseInt(
                  primaryCustomerContactInfoRequest?.workPhoneNumber.substring(
                    3,
                  ),
                  10,
                ))
            : null,
          (request.leadPhones[workPhoneObjectIndex].phoneInfo.phonePK =
            request?.leadPhones[workPhoneObjectIndex]?.phoneInfo?.phonePK || 0),
          (request.leadPhones[workPhoneObjectIndex].phoneInfo.doNotCall =
            primaryCustomerContactInfoRequest?.doNotCallWork),
          (request.leadPhones[workPhoneObjectIndex].phoneInfo.doNotText =
            primaryCustomerContactInfoRequest?.doNotTextWork),
          (request.leadPhones[workPhoneObjectIndex].phoneInfo.reasonForDnc =
            primaryCustomerContactInfoRequest?.doNotCallWorkReason),
          (request.leadPhones[workPhoneObjectIndex].phoneInfo.phoneType =
            'WORK'),
          (request.leadPhones[workPhoneObjectIndex].phoneInfo.reasonForDnt =
            primaryCustomerContactInfoRequest?.doNotTextWorkReason);
      } else {
        const borrowerPK =
          request?.leadPhones?.[0]?.phoneInfo?.borrowerPK || null;
        const {
          workPhoneNumber,
          doNotCallWork,
          doNotTextWork,
          doNotCallWorkReason = '',
          doNotTextWorkReason = '',
        } = primaryCustomerContactInfoRequest || {};
        const areaCode =
          workPhoneNumber?.length > 3 ? workPhoneNumber?.substring(0, 3) : '';
        const workNumber =
          workPhoneNumber?.length > 3
            ? parseInt(workPhoneNumber.substring(3), 10)
            : null;

        const workPhone: PhoneListItem = {
          pk: null,
          rowCreatedTimestamp: '',
          rowUpdatedTimestamp: '',
          tenantId: '',
          webUserId: '',
          phoneInfo: {
            phonePK: null,
            borrowerPK: borrowerPK,
            phoneType: 'WORK',
            areaCode: areaCode,
            phoneNumber: workNumber,
            phoneExtension: 0,
            doNotCall: doNotCallWork,
            reasonForDnc: doNotCallWorkReason,
            doNotText: doNotTextWork,
            reasonForDnt: doNotTextWorkReason,
            lastContactTimestamp: '',
          },
        };
        request?.leadPhones?.push(workPhone);
      }
    }

    if (
      primaryCustomerContactInfoRequest?.homePhoneNumber &&
      primaryCustomerContactInfoRequest?.homePhoneNumber.length > 3
    ) {
      if (request?.leadPhones[homePhoneObjectIndex]) {
        primaryCustomerContactInfoRequest?.homePhoneNumber.length > 3
          ? (request.leadPhones[homePhoneObjectIndex].phoneInfo.areaCode =
              primaryCustomerContactInfoRequest?.homePhoneNumber.substring(
                0,
                3,
              ))
          : '',
          primaryCustomerContactInfoRequest?.homePhoneNumber.length > 3
            ? (request.leadPhones[homePhoneObjectIndex].phoneInfo.phoneNumber =
                parseInt(
                  primaryCustomerContactInfoRequest?.homePhoneNumber.substring(
                    3,
                  ),
                  10,
                ))
            : null,
          (request.leadPhones[homePhoneObjectIndex].phoneInfo.phonePK =
            request?.leadPhones[homePhoneObjectIndex]?.phoneInfo?.phonePK || 0),
          (request.leadPhones[homePhoneObjectIndex].phoneInfo.doNotCall =
            primaryCustomerContactInfoRequest?.doNotCallHome),
          (request.leadPhones[homePhoneObjectIndex].phoneInfo.doNotText =
            primaryCustomerContactInfoRequest?.doNotTextHome),
          (request.leadPhones[homePhoneObjectIndex].phoneInfo.reasonForDnc =
            primaryCustomerContactInfoRequest?.doNotCallHomeReason),
          (request.leadPhones[homePhoneObjectIndex].phoneInfo.phoneType =
            'HOME'),
          (request.leadPhones[homePhoneObjectIndex].phoneInfo.reasonForDnt =
            primaryCustomerContactInfoRequest?.doNotTextHomeReason);
      } else {
        const borrowerPK =
          request?.leadPhones?.[0]?.phoneInfo?.borrowerPK || null;
        const {
          homePhoneNumber,
          doNotCallHome,
          doNotTextHome,
          doNotCallHomeReason = '',
          doNotTextHomeReason = '',
        } = primaryCustomerContactInfoRequest || {};
        const areaCode =
          homePhoneNumber?.length > 3 ? homePhoneNumber?.substring(0, 3) : '';
        const workNumber =
          homePhoneNumber?.length > 3
            ? parseInt(homePhoneNumber.substring(3), 10)
            : null;

        const homePhone: PhoneListItem = {
          pk: null,
          rowCreatedTimestamp: '',
          rowUpdatedTimestamp: '',
          tenantId: '',
          webUserId: '',
          phoneInfo: {
            phonePK: null,
            borrowerPK: borrowerPK,
            phoneType: 'HOME',
            areaCode: areaCode,
            phoneNumber: workNumber,
            phoneExtension: 0,
            doNotCall: doNotCallHome,
            reasonForDnc: doNotCallHomeReason,
            doNotText: doNotTextHome,
            reasonForDnt: doNotTextHomeReason,
            lastContactTimestamp: '',
          },
        };
        request?.leadPhones?.push(homePhone);
      }
    }

    const responseCode = await this?.changePrimaryCustomerContactInfo(request);

    return responseCode;
  };

  @action
  setCreditCardProps = (creditCardProps: CreditCardProps) => {
    this.creditCardProps = creditCardProps;
  };

  @action
  setLoadingCreditCardsProps = (loading: boolean) => {
    this.isLoadingCreditCardsProps = loading;
  };

  @action
  setBankAccountProps = (bankAccountProps: BankAccountProps) => {
    this.bankAccountProps = bankAccountProps;
  };

  @action
  setIsLoadingBankAccountProps = (loading: boolean) => {
    this.isLoadingBankAccountProps = loading;
  };

  @action
  getCreditCards = async (leadPk: number): Promise<number> => {
    this.setLoadingCreditCardsProps(true);
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getCreditCards/${leadPk}`,
    });
    const responseCode = (response && response.status) || 500;
    if (responseCode === 200) {
      this.setCreditCardProps({
        creditCards: response.data,
      });
    }
    this.setLoadingCreditCardsProps(false);
    return responseCode;
  };

  @action
  getBankAccounts = async (leadPk: number): Promise<number> => {
    this.setIsLoadingBankAccountProps(true);
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getBankAccounts/${leadPk}`,
    });
    const responseCode = (response && response.status) || 500;
    if (responseCode === 200) {
      this.setBankAccountProps({
        bankAccounts: response.data,
      });
    }
    this.setIsLoadingBankAccountProps(false);
    return responseCode;
  };

  @action
  moveToServicing = async (): Promise<ResponseType> => {
    const leadPk = this.leadPk();
    const utilityStore = this?.rootStore?.utilityStore;
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: `/uown/los/importToServicing/${leadPk}`,
    });
    await this.getLeadInfo(leadPk);
    await this.getAlertsForLead(leadPk);
    utilityStore?.setIsLoading(false);
    const responseData: ResponseType = {
      status: (response && response.status) || 500,
      message: response?.message,
    };
    return responseData;
  };

  @action
  changeLeadStatus = async (
    changeLeadStatusRequest: ChangeLeadStatusRequest,
  ): Promise<ResponseType> => {
    const leadPk = this.leadPk();
    const utilityStore = this?.rootStore?.utilityStore;
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/los/changeLeadStatus',
      data: changeLeadStatusRequest,
    });

    await this.getLeadInfo(leadPk);

    utilityStore?.setIsLoading(false);
    return {
      status: (response && response.status) || 500,
      message: response?.message || null,
    };
  };

  @action
  settleApplication = async (
    settleApplicationRequest: GetInvoiceInfoResponseType,
  ): Promise<ResponseType> => {
    const leadPk = this.leadPk();
    if (settleApplicationRequest?.merchantInfo?.altContactPhone) {
      const altPhone = settleApplicationRequest?.merchantInfo?.altContactPhone;
      settleApplicationRequest.merchantInfo.altContactPhone =
        unformatPhoneAndCard(altPhone);
    }
    if (settleApplicationRequest?.merchantInfo?.phoneNumber) {
      const phone = settleApplicationRequest?.merchantInfo?.phoneNumber;
      settleApplicationRequest.merchantInfo.phoneNumber =
        unformatPhoneAndCard(phone);
    }
    if (settleApplicationRequest?.merchantInfo?.primaryContactPhone) {
      const primaryPhone =
        settleApplicationRequest?.merchantInfo?.primaryContactPhone;
      settleApplicationRequest.merchantInfo.primaryContactPhone =
        unformatPhoneAndCard(primaryPhone);
    }
    const utilityStore = this?.rootStore?.utilityStore;
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/settleApplication',
      data: settleApplicationRequest,
    });
    await this.getLeadInfo(leadPk);
    utilityStore?.setIsLoading(false);
    const responseData: ResponseType = {
      status: (response && response.status) || 500,
      message: response?.message || null,
    };
    return responseData;
  };

  @action
  setContracts = (contracts: Contract[]) => {
    this.contracts = orderBy(
      contracts,
      (item) => new Date(item?.rowCreatedTimestamp),
      'desc',
    );
  };

  @action
  setIsLoadingContracts = (loading: boolean) => {
    this.isLoadingContracts = loading;
  };

  @action
  getContracts = async (leadPk: number) => {
    this.setIsLoadingContracts(true);
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getContracts/${leadPk}`,
    });
    if (response?.data && Array.isArray(response?.data)) {
      this.setContracts(response.data || []);
    }

    this.setIsLoadingContracts(false);
    return (response && response.status) || 500;
  };

  @action
  getAlertsForLead = async (leadPk: number) => {
    this.setIsLoadingAlert(true);
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getAlertsForLead/${leadPk}`,
    });
    this.setAlertMessages(response?.data || []);
    this.setIsLoadingAlert(false);
    return (response && response.status) || 500;
  };

  @action
  setAlertMessages = (alertMessages: string[]): void => {
    this.alertMessages = alertMessages;
  };

  @action
  setIsLoadingAlert = (loading: boolean) => {
    this.isLoadingAlert = loading;
  };

  @action
  setAllAlerts = (alerts: PaginatedResults<Alert>) => {
    this.alerts = alerts;
  };

  @action
  getAllAlerts = async ({
    page,
    size,
    message = '',
    from = null,
    to = null,
    isDownload = false,
  }: AlertFilters) => {
    this.setIsLoadingAlert(true);
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: '/uown/los/getAllAlerts',
      params: {message, from, to, page, size},
    });
    if (response && response.data && !isDownload) {
      this.setAllAlerts(response.data);
    }
    this.setIsLoadingAlert(false);
    return response;
  };

  @action
  resendESign = async () => {
    const utilityStore = this.rootStore?.utilityStore;
    const leadPk = this.leadPk();
    const primaryEmail = this.customerEmail();
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: `/uown/los/resendLease/${leadPk}?emailAddress=${primaryEmail}`,
      isHandleLoader: true,
    });
    return (response && response.status) || 500;
  };

  @action
  sendNewApplication = async (
    newApplicationRequest: NewApplicationInfo,
  ): Promise<ResponseType> => {
    const {custEmailAddress, custPhoneNumber} = newApplicationRequest || {};
    const utilityStore = this?.rootStore?.utilityStore;
    const overviewStore = this?.rootStore?.overviewStore;
    // const merchRefCode = newApplicationRequest?.refMerchantCode || '';
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/sendApplicationToCustomer',
      data: newApplicationRequest,
    });

    if (custEmailAddress || custPhoneNumber) {
      await overviewStore?.getSendApplicationRequestsByCriteria({
        from: formatDate({f: 'api', d: getDate()}),
        to: formatDate({f: 'api', d: getDate()}),
        pageNumber: 0,
        maxResults: 10,
        merchantNames: [],
        searchString: '',
      });
    }

    const responseData: ResponseType = {
      data: response && response?.data,
      status: (response && response.status) || 500,
      message: response?.message || null,
    };
    return responseData;
  };

  @action
  overrideApprovalAmount = async (
    approvalAmountRequest: ApprovalAmount,
  ): Promise<ResponseType> => {
    const {leadPk} = approvalAmountRequest || {};
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/los/overrideApprovalAmount',
      data: approvalAmountRequest,
      isHandleLoader: true,
    });
    if (response?.status === 200) {
      await this?.getAlertsForLead(leadPk);
      await this?.getActivityLogs(leadPk);
      await this?.getLeadInfo(leadPk);
    }
    const responseData: ResponseType = {
      status: (response && response.status) || 500,
      message: response?.message || null,
      data: response?.data || null,
    };
    return responseData;
  };

  @action
  updateBankruptcy = async (
    pastBankruptcy: string,
    curOrFutureBankruptcy: string,
  ): Promise<ResponseType> => {
    const newPastBankruptcy = isEqual(pastBankruptcy, 'Yes');
    const newCurOrFutureBankruptcy = isEqual(curOrFutureBankruptcy, 'Yes');
    const data = {
      leadPk: this?.accountPk,
      currentOrFutureBankruptcy: newCurOrFutureBankruptcy,
      pastBankruptcy: newPastBankruptcy,
    };
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/los/updateBankruptcyInfo',
      data: data,
      isHandleLoader: true,
    });

    if (response && response?.status === 200) {
      this.setLeadInfo(response?.data);
    }
    const responseData: ResponseType = {
      status: (response && response?.status) || 500,
      message: response?.message,
    };
    return responseData;
  };

  @action
  getStateForZipcode = async (zipCode: string): Promise<string> => {
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/getStateForZipcode/${zipCode}`,
    });
    const stateResponse = response?.data || '';
    return stateResponse && typeof stateResponse === 'string'
      ? stateResponse
      : '';
  };

  @action
  getDocumentStatus = async () => {
    const leadPk = this?.leadPk();
    const leadInfoUuid = this?.leadInfo?.uuid;
    const response = await this?.rootStore?.utilityStore?.getApplicationStatus(leadInfoUuid);
    await this?.getInvoiceInfo();
    await this?.getLeadInfo(leadPk);
    await this?.getContracts(leadPk);
    await this?.getActivityLogs(leadPk);
    if (response?.refMerchantCode) {
      showToast('success', 'Successfully retrieved the latest status.');
    } else {
      // @ts-ignore
      showToast('error', response?.message);
    }
  };

  @action
  toggleAlerts = (isShowingAlert: boolean): void => {
    this.isShowingAlert = isShowingAlert;
  };

  @action
  setIsLeaseModified = (isLeaseModified: boolean): void => {
    this.isLeaseModified = isLeaseModified;
  };

  @action
  changeMerchant = async (
    merchantPK: number,
    originalMerchantPk: number,
  ): Promise<ResponseType> => {
    const utilityStore = this.rootStore?.utilityStore;
    const leadPk = this.leadPk();
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/los/changeMerchant',
      params: {
        leadPk: leadPk,
        merchantPk: merchantPK,
        originalMerchantPk: originalMerchantPk,
      },
    });

    utilityStore?.setIsLoading(false);
    const responseObject: ResponseType = {
      message: response?.data?.message || '',
      status: response?.data?.status || response?.status || 500,
      data: response?.data || {},
    };

    return responseObject;
  };

  @action
  verifyUserAuthorization = async (
    customerPk: string | number,
    savedPath?: string,
  ) => {
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/getCustomerInformation',
      data: {customerPk},
      isHandleLoader: true,
    });

    if (response === undefined) {
      this.rootStore?.utilityStore?.setPreviousPath(savedPath);
    } else if (response?.status !== 200) {
      this.rootStore?.utilityStore?.setPreviousPath('/');
    }

    return (response && response?.status) || 500;
  };

  @action
  getSessionId = async (): Promise<ResponseType> => {
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: '/getSessionId',
    });

    return {
      status: response?.status || 500,
      message: response?.message || '',
      data: response?.data,
    };
  };

  @action
  getDocumentsInfo = async (leadPk: string | number) => {
    this.setIsLoadingDocuments(true);
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/svc/getFilesForLead?leadPk=${leadPk}`,
    });

    if (response?.status === 200 || response?.status === 304) {
      this.setDocuments(response?.data);
    }
    this.setIsLoadingDocuments(false);
    return {
      status: response?.status || 500,
      message: response?.message || '',
    };
  };

  @action
  setDocuments = (documents: Document[]): void => {
    this.documents = documents;
  };

  @action
  setIsLoadingDocuments = (loading: boolean) => {
    this.isLoadingDocument = loading;
  };

  @action
  verifyPhoneBeforeSigning = async (
    leadPk: number,
    phoneNumber: string,
  ): Promise<ResponseType> => {
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/verifyPhoneBeforeSigning/${leadPk}?phoneNumber=${phoneNumber}`,
      isHandleLoader: true,
    });

    return {
      status: response?.status || 500,
      message: response?.message || '',
      data: response?.data,
    };
  };

  @action
  runUnderWriting = async (
    leadPk: number,
    comment: string,
    forceUW?: boolean,
  ): Promise<ResponseType> => {
    let params = `?comment=${comment}`;
    params += typeof forceUW !== 'undefined' ? `&forceUW=${forceUW}` : '';

    const utilityStore = this.rootStore.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: `/uown/los/runUnderwritingForLead/${leadPk}${params}`,
      isHandleLoader: true,
    });

    return {
      status: response?.status || 500,
      message: response?.message || '',
    };
  };

  @action
  addNewLease = async (
    invoiceInfo: GetInvoiceInfoResponseType,
  ): Promise<ResponseType> => {
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/los/addNewLease',
      data: invoiceInfo,
      isHandleLoader: true,
    });

    if (response?.status === 200 && !response?.data?.error) {
      utilityStore?.setIsLoading(true);
    }

    return {
      status: response?.status || 500,
      message: response?.message || '',
      data: response?.data,
    };
  };

  @action
  setIsAddNewInvoice = (isAddNewInvoice: boolean): void => {
    this.isAddNewInvoice = isAddNewInvoice;
  };

  @action
  checkRemainingApprovalAmount = async (leadPk: number) => {
    const utilityStore = this.rootStore.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/checkRemainingApprovalBeforeAddLease/${leadPk}`,
      isHandleLoader: true,
    });

    this.setReApprovalAmount(response?.data || null);

    return {
      status: response?.status || 500,
      message: response?.message || '',
      data: response?.data || {},
    };
  };

  @action
  setReApprovalAmount = (reApprovalAmount: number): void => {
    this.reApprovalAmount = reApprovalAmount;
  };

  @action
  storeRecordingInfo = async (
    leadPk: number,
    recordingId: string,
  ): Promise<ResponseType> => {
    const utilityStore = this.rootStore.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/los/storeRecordingInfo',
      data: {leadPk, uuid: recordingId},
    });
    if (response?.status === 200) {
      sessionStorage?.setItem('sentUuid', recordingId);
    }
    return {
      status: response?.status || 500,
      message: response?.message || '',
    };
  };

  @action
  getRecordingInfoForLead = async (leadPk: number): Promise<ResponseType> => {
    const utilityStore = this.rootStore.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getRecordingInfoForLead/${leadPk}`,
    });
    return {
      status: response?.status || 500,
      message: response?.message || '',
      data: response?.data,
    };
  };

  @action
  sendTrustpilotInvitation = async (leadPk: number) => {
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: `/uown/los/sendTrustpilotInvitation/${leadPk}`,
    });

    return {
      status: response?.status || 500,
      message: response?.message || '',
    };
  };

  @action
  setRedirectUrl = (redirectUrl: string): void => {
    this.redirectUrl = redirectUrl;
  };

  @action
  getLast3Payments = async (leadPk: number) => {
    this.setIsLoadingLast3Payments(true);
    const {utilityStore} = this?.rootStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getLastThreeCCTransactions/${leadPk}`,
    });

    if (response?.status === 200) {
      this.setLast3Payments(response?.data);
    }
    this.setIsLoadingLast3Payments(false);
    return {
      status: response?.status || 500,
    };
  };

  @action
  getAllPayments = async (leadPk: number) => {
    this.setIsLoadingAllPayments(true);
    const {utilityStore} = this.rootStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getCCTransactions/${leadPk}`,
    });

    if (response?.status === 200) {
      this.setAllPayments(response?.data);
    }
    this.setIsLoadingAllPayments(false);
    return {
      status: response?.status || 500,
    };
  };

  @action
  blacklistAllItemsForLead = async (leadPk: number) => {
    const utilityStore = this?.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: `/uown/los/blackListAllItemsForLead?leadPk=${String(leadPk || '')}`,
      isHandleLoader: true,
    });

    if (response?.status === 200) {
      this.getLeadInfo(leadPk);
    }

    return {
      status: response?.status || 500,
      message: response?.message || '',
    };
  };

  @action
  setLast3Payments = (last3Payments: Payments[]) => {
    this.last3Payments = last3Payments;
  };

  @action
  setIsLoadingLast3Payments = (loading: boolean) => {
    this.isLoadingLast3Payments = loading;
  };

  @action
  setAllPayments = (allPayments) => {
    this.allPayments = allPayments;
  };

  @action
  setIsLoadingAllPayments = (loading: boolean) => {
    this.isLoadingAllPayments = loading;
  };

  @action
  setVisitedAccounts = (visitedAccounts: string[]) => {
    this.visitedAccounts = visitedAccounts;
  };

  @action
  setProtectionPlanInfo = (info: ProtectionPlanInfo | null) => {
    this.protectionPlanInfo = info;
  };

  @action
  setIsLoadingProtectionPlanInfo = (loading: boolean) => {
    this.isLoadingProtectionPlanInfo = loading;
  };

  @action
  getProtectionPlanInfo = async (leadPk: number) => {
    this.setIsLoadingProtectionPlanInfo(true);
    const {utilityStore} = this?.rootStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/uown/los/getProtectionPlanForLead/${leadPk}`,
    });

    if (response?.status === 200) {
      this.setProtectionPlanInfo(
        response?.data?.protectionPlanInfo || response?.data,
      );
    }

    this.setIsLoadingProtectionPlanInfo(false);

    return {
      status: response?.status || 500,
    };
  };

  // @action
  // createOrUpdateSeon = async (seonInfo: {
  //   leadPk: number;
  //   referenceId: string;
  //   status: string;
  //   fullName?: string;
  //   fullAddressCheckResult?: string;
  //   nameMatchCheckResult?: string;
  //   error?: string;
  //   results?: string;
  // }) => {
  //   const utilityStore = this?.rootStore?.utilityStore;

  //   const response = await utilityStore?.sendRequest({
  //     method: 'POST',
  //     url: '/uown/los/seon/createOrUpdate',
  //     data: seonInfo,
  //   });

  //   return {
  //     status: response?.status || 500,
  //     message: response?.message || '',
  //     data: response?.data || null,
  //   };
  // };

  @action
  reset = (): void => {
    this.quickSearchResults = [];
    this.primaryCustomerInfo = undefined;
    this.primaryCustomerContactInfo = undefined;
    this.employmentInfo = undefined;
    this.activityLogs = new PaginatedActivityLogs();
    this.merchantInfo = undefined;
    this.creditCardProps = undefined;
    this.bankAccountProps = undefined;
    this.leadInfo = undefined;
    this.leadStatus = undefined;
    this.contracts = [];
    this.alerts = defaultPaginatedResp([]);
    this.alertMessages = [];
    this.isShowingAlert = true;
    this.isLeaseModified = false;
    this.minimumLeaseAmount = undefined;
    this.invoiceInfo = undefined;
    this.documents = [];
    this.lastReviewLogAccountPk = null;
    this.accountPk = null;
    this.isAddNewInvoice = false;
    this.reApprovalAmount = null;
    this.redirectUrl = undefined;
    this.isLoadingPrimaryCustomerInfo = null;
    this.isLoadingPrimaryCustomerContactInfo = null;
    this.isLoadingEmploymentInfo = null;
    this.thirdPartyContact = undefined;
    this.isLoadingActivityLogs = null;
    this.isLoadingInvoiceInfo = null;
    this.items = [];
    this.isLoadingMerchantInfo = null;
    this.isLoadingCreditCardsProps = null;
    this.isLoadingBankAccountProps = null;
    this.isLoadingLeadInfo = null;
    this.isLoadingContracts = null;
    this.isLoadingAlert = null;
    this.lastReviewLog = undefined;
    this.paymentProgramData = [];
    this.isLoadingDocument = null;
    this.onGoingSearch = undefined;
    this.last3Payments = undefined;
    this.isLoadingLast3Payments = null;
    this.allPayments = undefined;
    this.isLoadingAllPayments = null;
    this.visitedAccounts = [];
    this.protectionPlanInfo = undefined;
    this.isLoadingProtectionPlanInfo = null;
  };
}




domain/stores/utility.tsx
import {makeObservable, observable, action} from 'mobx';
import {persist} from 'mobx-persist';
import {RootStore} from '@stores/root';
import {BaseStore} from '@stores/base';
import {AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders} from 'axios';
import {sendRequest, formatDate} from '@uownleasing/common-utilities';
import {ResponseType, ResponseTyped, SearchType} from '@uownleasing/common-ui';
import {
  SubmitApplicationResponse,
  SendApplicationRequest,
  MissingDataResponse,
  GetMissingRequiredFieldsParams,
  SavedPathPortals,
  GetApplicationStatusResponse,
  UserOnPage,
  EsignContractBody,
  PaymentProgramData,
  ItemPaymentSummary,
  BasicCustomerData,
  SendApplicationResponse,
} from '@models';
import {
  decideApplicationUrl,
  handlePostMessageCheck,
  inIFrame,
} from '@utils/helper';
import {ProtectionPlan} from 'models/protection-plan';
import {Payments} from 'models/payments';
import {CRATokenErrResponse, CRATokenResponse} from 'models/craToken';
import {
  PlaidLinkOnExitMetadata,
  PlaidLinkOnSuccessMetadata,
} from 'react-plaid-link';
import {CanContinueApplication} from 'models/can-continue-application';

interface SendRequestProps extends AxiosRequestConfig {
  isHandleLoader?: boolean;
  isDownloadCSV?: boolean;
  detectIframe?: boolean;
}

export class UtilityStore extends BaseStore {
  @observable
  @persist
  achDiscount: number = 0;

  @observable
  @persist
  isPaymentProgramModalOpen: boolean = false;

  @observable
  @persist
  serverTimeOffset: number = 0;

  @observable
  @persist
  isLoading: boolean = false;

  @observable
  @persist
  alertModalMessage: string = '';

  @observable
  @persist('list')
  missingFields: string[] = [];

  @observable
  @persist
  leadPk: number = null;

  @observable
  @persist
  achAutoPay: boolean = false;

  @observable
  @persist
  feeToBeCharged: number = null;

  @observable
  @persist
  isIdCheckRequired: boolean = false;

  @observable
  @persist
  idCheckProvider: string = '';

  @observable
  @persist
  securityDeposit: number = null;

  @observable
  @persist
  signingFeeExists: boolean = false;

  @observable
  @persist
  uuid: string = '';

  @observable
  @persist
  selectedPaymentFrequency: string = '';

  @observable
  @persist
  merchant: string = '';

  // @observable
  // @persist
  // embeddedSigningUrl: string = '';

  @observable
  @persist('object')
  submitApplicationResponse: SubmitApplicationResponse = undefined;

  @observable
  @persist
  isSideBarCollapsed: boolean = false;

  @observable
  @persist
  isErrorCoolDown: boolean = false;

  @observable
  @persist
  isCustomerLeaseModalOpen: boolean = false;

  @observable
  @persist('object')
  previousPath: SavedPathPortals = {
    servicing: '',
    origination: '',
  };

  @observable
  @persist
  phoneVerificationRequired: boolean = false;

  @observable
  @persist
  firstPaymentDate: string = '';

  @observable
  @persist
  isBankVerificationRequired: boolean = false;

  @observable
  @persist
  isBankVerificationSubmitted: boolean = false;

  @observable
  @persist('list')
  paymentPrograms: PaymentProgramData[] = [];

  @observable
  @persist
  recordSigningFlow: boolean = false;

  @observable
  @persist('object')
  itemPaymentSummary: ItemPaymentSummary = undefined;

  @observable
  @persist('object')
  basicCustomerData: BasicCustomerData = undefined;

  @observable
  @persist('object')
  searchType: SearchType = SearchType['Lead #'];

  @observable
  @persist('object')
  protectionPlan: ProtectionPlan = undefined;

  constructor(rootStore: RootStore) {
    super(rootStore);
    makeObservable(this);
  }

  @action
  setPreviousPath = (path = '') => {
    this.previousPath = {
      servicing: this?.previousPath?.servicing || '',
      origination: path,
    };
  };

  @action
  setIsPaymentProgramModalOpen = (isPaymentProgramModalOpen: boolean): void => {
    this.setIsLoading(true);
    this.isPaymentProgramModalOpen = isPaymentProgramModalOpen;
    this.setIsLoading(false);
  };

  iframeUsername = (userName: string): string => {
    if (inIFrame()) {
      return 'IFrame';
    }
    return userName ? `MerchantPortal-${userName}` : 'MerchantPortal';
  };

  @action
  sendRequest = async (props: SendRequestProps): Promise<any> => {
    const {
      isHandleLoader,
      isDownloadCSV,
      detectIframe = false,
      ...sendRequestProps
    } = props;
    const {accountStore, customerStore} = this.rootStore || {};
    const userToken = accountStore?.userToken || '';
    const username = detectIframe
      ? this.iframeUsername(accountStore?.userEmail)
      : accountStore?.userEmail || '';
    const leadPk = customerStore?.leadPk();

    const userPath =
      typeof window !== 'undefined' ? window?.location?.pathname : '';

    const reqConfig: AxiosRequestConfig = {
      headers: {
        userToken: userToken,
        username: username,
        'user-path': userPath,
        'content-type': 'application/json',
        'user-account-opened': String(leadPk),
      },
      ...sendRequestProps,
    };

    const handleResponseHeaders = (headers: AxiosResponseHeaders) => {
      const {usertoken = '', servertimeutcoffset = ''} = headers;
      if (usertoken) {
        accountStore.setUserToken(usertoken);
      }
      if (servertimeutcoffset) {
        this.setServerTimeOffset(servertimeutcoffset);
      }
    };

    const refreshBackgroundData = async () => {
      const {method = 'GET'} = props || {};

      // Refreshes token whenever there is an ongoing CSV download
      if (isDownloadCSV) {
        await accountStore?.refresh();
      }

      // Refreshes data whenever a non-GET request is ran.
      if (method !== 'GET' && leadPk) {
        await this?.getUsersOnPage();
      }
    };

    if (isHandleLoader) {
      this?.setIsLoading(true);
    }

    const urlsToIgnoreRelogLogs = [
      '/uown/los/getLogsForLead',
      '/uown/getApplicationCountDetails',
      '/uown/getApprovalRateDetails',
      '/uown/getAvgApprovalDetails',
      '/uown/getOpenApprovalAmt',
      '/uown/getFundedAmtDetails',
      '/uown/getSignedLeaseApprovals',
      '/uown/getExpiringAppDetails',
      '/uown/getConversionRate',
      '/uown/los/getLocationNamesByMerchant',
      '/uown/getLeadsInDateRange',
      '/uown/los/getBasicMerchantInfoByRefCode',
    ];

    const doRefesh =
      urlsToIgnoreRelogLogs.filter((_) => reqConfig.url.startsWith(_))
        .length === 0;
    const response = await sendRequest({
      reqConfig: reqConfig,
      handleResponseHeaders,
      refreshBackgroundData: doRefesh
        ? refreshBackgroundData
        : () => Promise.resolve(),
      isErrorCoolDown: this?.isErrorCoolDown || false,
      setIsErrorCoolDown: this?.setIsErrorCoolDown || (() => undefined),
      logout: accountStore?.logout,
    });

    if (isHandleLoader) {
      this?.setIsLoading(false);
    }
    return response;
  };

  @action
  getApplicationStatus = async (
    targetUuid: string,
  ): Promise<
    GetApplicationStatusResponse & {isCustomerAbleToSubmitApplication: boolean}
  > => {
    const response = await this?.sendRequest({
      method: 'POST',
      url: '/uown/los/getApplicationStatus',
      data: {uuid: targetUuid || this?.uuid || ''},
    });
    if (response.status !== 200) {
      return {
        applicationFound: false,
        applicationSubmitted: false,
        transactionStatus: '',
        isCustomerAbleToSubmitApplication: false,
      };
    }
    return {
      ...(response?.data ?? {}),
      isCustomerAbleToSubmitApplication:
        response?.data?.applicationFound &&
        !response?.data?.applicationSubmitted,
    };
  };

  @action
  canContinueApplication = async (
    targetUuid: string,
    shortCode: string,
  ): Promise<Partial<CanContinueApplication>> => {
    const resp = await this.sendRequest({
      method: 'POST',
      url: '/uown/los/canContinueApplication',
      // Remove on 1.50
      data: {uuid: targetUuid, shortCode},
    });
    return resp.status === 200 ? resp.data : {};
  };

  @action
  sendApplication = async (
    sendApplicationRequest: SendApplicationRequest,
  ): Promise<ResponseTyped<SendApplicationResponse>> => {
    const response = await this?.sendRequest({
      method: 'POST',
      url: '/uown/los/sendApplication',
      data: sendApplicationRequest,
    });

    return response;
  };

  @action
  getPlaidToken = (
    leadPk: number,
  ): Promise<ResponseTyped<CRATokenResponse | CRATokenErrResponse>> => {
    return this.sendRequest({
      method: 'POST',
      url: '/uown/los/getPlaidToken',
      data: {leadPk},
    });
  };

  @action
  sendPlaidStatus = (
    leadPk: number,
    eventName: string,
    metadata: PlaidLinkOnSuccessMetadata | PlaidLinkOnExitMetadata,
  ) => {
    return this.sendRequest({
      method: 'POST',
      url: '/uown/los/sendPlaidStatus',
      data: {leadPk, eventName, metadata},
    });
  };

  @action
  getMissingRequiredFields = async (
    props: GetMissingRequiredFieldsParams,
  ): Promise<ResponseTyped<MissingDataResponse>> => {
    const {uuid, selectedPaymentFrequency = '', shortCode} = props;
    this.reset();
    this.setIsLoading(true);

    const uuidString = Array.isArray(uuid) ? uuid.join('') : uuid;
    const shortCodeString = Array.isArray(shortCode)
      ? shortCode.join('')
      : shortCode;
    this.setUuid(uuidString);

    const selectedPaymentFrequencyString = Array.isArray(
      selectedPaymentFrequency,
    )
      ? selectedPaymentFrequency.join('')
      : selectedPaymentFrequency;
    this.setSelectedPaymentFrequency(selectedPaymentFrequencyString);

    const response: AxiosResponse<MissingDataResponse> =
      await this?.sendRequest({
        method: 'GET',
        url: decideApplicationUrl.getMissingRequiredFieldsUrl(
          uuidString,
          shortCodeString,
        ),
        params: {
          selectedPaymentFrequency: selectedPaymentFrequencyString,
        },
        detectIframe: true,
      });
    const responseData = response?.data;
    this.setMissingFields(responseData?.missingFields || []);
    this.setLeadPk(responseData.leadPk);
    this.achAutoPay = responseData?.achAutoPay;
    this.feeToBeCharged = responseData?.feeToBeCharged;
    this.setSigningFeeExists(responseData?.signingFeeExists);
    this.achDiscount = responseData?.achDiscount;
    this.setPhoneVerificationRequired(responseData?.verifyPhoneBeforeSigning);
    const {isIdCheckRequired} = responseData || {};
    const {idCheckProvider} = responseData || {};
    this.idCheckProvider = idCheckProvider || '';
    this.setIdCheckProvider(idCheckProvider);
    this.setIsIdCheckRequired(isIdCheckRequired);
    this.setIsBankVerificationSubmitted(
      responseData?.isBankVerificationSubmitted,
    );
    this.setIsBankVerificationRequired(
      responseData?.isBankVerificationRequired,
    );
    this.setRecordSigningFlow(responseData?.recordSigningFlow);

    this.securityDeposit = responseData?.securityDeposit;

    this.setItemPaymentSummary(responseData?.itemPaymentSummary);

    this.setBasicCutomerData(responseData?.basicCustomerData);

    const errorMessage = response?.data?.message || '';
    const statusCodeToReturn = response?.data?.status || response?.status;

    const errorToReturn =
      statusCodeToReturn !== 200
        ? errorMessage || 'Unable to retrieve your application.'
        : '';
    return {
      status: statusCodeToReturn,
      message: errorToReturn,
      data: responseData,
    };
  };

  @action
  getFinalizeApplicationFields = async (
    uuid: string | string[],
    shortCode: string | string[],
  ): Promise<ResponseType> => {
    this.reset();
    this.setIsLoading(true);

    const uuidString = Array.isArray(uuid) ? uuid.join('') : uuid;
    this.setUuid(uuidString);

    const response: AxiosResponse<MissingDataResponse> =
      await this?.sendRequest({
        method: 'GET',
        url: decideApplicationUrl.getFinalizeRequiredFieldsUrl(
          uuidString,
          shortCode?.toString(),
        ),
      });
    const responseData = response?.data;
    const errorMessage = response?.data?.message || '';
    const statusCodeToReturn = response?.data?.status || response?.status;

    const errorToReturn =
      statusCodeToReturn !== 200
        ? errorMessage || 'Unable to retrieve the approval fields.'
        : '';
    return {
      status: statusCodeToReturn,
      message: errorToReturn,
      data: responseData,
    };
  };

  @action
  createProtectionPlan = async (
    data: ProtectionPlan,
  ): Promise<Omit<ResponseType, 'data'>> => {
    const response = await this?.sendRequest({
      method: 'POST',
      url: '/uown/los/createProtectionPlan',
      data: {...data},
    });
    this.setProtectionPlan(response.data);
    return {
      status: response?.status || 500,
      message: response?.message || '',
    };
  };

  @action
  getFinalApprovalDetails = async (
    leadPk: number | string,
  ): Promise<ResponseType> => {
    this.reset();
    this.setIsLoading(true);

    const response: AxiosResponse<MissingDataResponse> =
      await this?.sendRequest({
        method: 'GET',
        url: `/uown/los/getFinalApprovalDetails/${leadPk}`,
      });
    const responseData = response?.data;
    const errorMessage = response?.data?.message || '';
    const statusCodeToReturn = response?.data?.status || response?.status;

    const errorToReturn =
      statusCodeToReturn !== 200
        ? errorMessage || 'Unable to retrieve your approval details.'
        : '';
    return {
      status: statusCodeToReturn,
      message: errorToReturn,
      data: responseData,
    };
  };

  @action
  getEsignRedirectUrlByLead = async (reqType = 'error'): Promise<string> => {
    const leadPk = this?.leadPk || '';
    const response = await this?.sendRequest({
      method: 'GET',
      url: `/uown/los/getEsignRedirectUrlByLead/${leadPk}/${reqType}`,
      isHandleLoader: true,
    });
    const redirectUrl =
      response?.data?.postMessageRedirectUrl || response?.data?.redirectUrl;

    if (redirectUrl) {
      await handlePostMessageCheck(redirectUrl);
      this.rootStore.customerStore.setRedirectUrl(redirectUrl);
    } else {
      // eslint-disable-next-line no-console
      console.log(
        'No redirect url returned so no redirect will happen from our end',
      );
    }

    return response?.status &&
      response?.status === 200 &&
      response?.data &&
      !response?.data?.status &&
      redirectUrl
      ? redirectUrl
      : '';
  };

  @action
  getEsignFields = async (
    uuid: string,
    shortCode: string,
  ): Promise<ResponseType> => {
    const response = await this.sendRequest({
      method: 'GET',
      url: decideApplicationUrl.getEsignFieldsUrl(uuid, shortCode),
      params: {
        uuid: uuid,
        shortCode,
      },
      isHandleLoader: true,
    });
    const {data, status, message} = response;
    if (status === 200) {
      this.setPaymentPrograms(data?.paymentOptions || []);
      this.setPhoneVerificationRequired(data?.phoneVerificationRequired);
      this.setLeadPk(data?.leadPk);
    }
    return {
      status: status || 500,
      message: message || '',
    };
  };

  @action
  generateEsignContract = async (
    esignContractBody: EsignContractBody,
  ): Promise<ResponseType> => {
    const response = await this.sendRequest({
      method: 'POST',
      url: '/uown/los/generateEsignContract',
      data: esignContractBody,
      isHandleLoader: true,
    });

    const embeddedSigningUrl = response?.data?.embeddedSigningUrl || '';
    if (embeddedSigningUrl) {
      this.setSubmitApplicationResponse(response?.data);
    }

    return {
      status: response?.status || 500,
      message: response?.message || '',
    };
  };

  @action
  authorizeCreditCard = async (
    ccNumber: string,
    ccExp: string,
    cvc: string,
    ccFirstName: string,
    ccLastName: string,
    kountSessionId: string,
  ): Promise<ResponseTyped<Partial<Payments['creditCardTransactionInfo']>>> => {
    const reqData = {
      leadPk: this.leadPk,
      ccNumber: ccNumber || '',
      ccExp: ccExp || '',
      cvc: cvc || '',
      ccFirstName: ccFirstName || '',
      ccLastName: ccLastName || '',
      kountSessionId: kountSessionId || '',
    };
    const response = await this?.sendRequest({
      method: 'POST',
      url: '/uown/los/authorizeCreditCard',
      data: reqData,
      isHandleLoader: true,
      detectIframe: true,
    });
    const isApproved =
      (response &&
        response.data &&
        response.data.status &&
        response.data.status === 'APPROVED') ||
      false;
    return {
      status: (isApproved && response.status) || 500,
      message: response?.message,
      data: response?.data || {},
    };
  };

  @action
  submitApplication = async (
    reqData: any,
  ): Promise<Omit<ResponseTyped<unknown>, 'data'>> => {
    this.submitApplicationResponse = undefined;
    reqData.leadPk = this.leadPk || '';
    if (this.selectedPaymentFrequency) {
      reqData.desiredPaymentFrequency = this.selectedPaymentFrequency || '';
    }
    reqData.appUuid = this.uuid || '';

    const response = await this?.sendRequest({
      method: 'POST',
      url: '/uown/los/submitApplication',
      data: reqData,
      isHandleLoader: true,
      detectIframe: true,
    });

    const embeddedSigningUrl = response?.data?.embeddedSigningUrl || '';

    let errorToReturn = '';
    const errorMessage = response?.data?.message || '';
    const statusCode = response?.status || 500;

    if (embeddedSigningUrl) {
      // response.data.embeddedSigningUrl =
      //   'https://app.pandadoc.com/document/f3679c5a075603df8e511f71da25357978d94ad9';
      this.setSubmitApplicationResponse(response?.data);
    }

    if (statusCode === 412) {
      errorToReturn =
        errorMessage ||
        'Unable to verify your identification. Please try again.';
    } else if (errorMessage) {
      errorToReturn = errorMessage;
    } else if (statusCode !== 200) {
      errorToReturn =
        'We were unable to finalize your uown contract. Please try again later or contact uown if the issue persists.';
    } else if (response?.data?.error) {
      errorToReturn = response?.data?.error;
    }

    return {
      message: errorToReturn || '',
      status: statusCode,
    };
  };

  @action
  getCalculatorResults = async () => {
    const data = {
      state: 'CA',
      zipCode: '92821',
      taxRate: '',
      numberOfMonths: 13,
      costPrice: 1000,
    };
    const response = await this?.sendRequest({
      method: 'POST',
      url: '/uown/getCalculatorResults',
      data: data,
    });
    return response.data;
  };

  @action
  getUsersOnPage = async (): Promise<UserOnPage[]> => {
    let usersOnPage = [];
    const response = await this?.sendRequest({
      method: 'GET',
      url: '/uown/users-on-page',
    });
    const responseStatusCode =
      (response && (response?.data?.status || response?.status)) || 500;
    if (
      responseStatusCode !== 500 &&
      response?.data &&
      Array.isArray(response?.data)
    ) {
      usersOnPage = response?.data;
    }
    return usersOnPage;
  };

  @action
  getIntellicheckResults = async () => {
    const leadPk = this.leadPk || null;
    const response = await this.sendRequest({
      method: 'GET',
      url: `/uown/los/getResults/${leadPk}`,
    });

    return (response && response?.status) || 500;
  };

  @action
  setProtectionPlan = async (protectionPlan: ProtectionPlan) => {
    this.protectionPlan = protectionPlan;
  };

  @action
  setIsLoading = (isLoading: boolean) => {
    this.isLoading = isLoading;
  };

  @action
  setSubmitApplicationResponse = (
    submitApplicationResponse: SubmitApplicationResponse,
  ) => {
    this.submitApplicationResponse = submitApplicationResponse;
  };

  @action
  setAlertModalMessage = (alertModalMessage: string) => {
    this.alertModalMessage = alertModalMessage;
  };

  @action
  setUuid = (uuid: string) => {
    this.uuid = uuid;
  };

  @action
  setSelectedPaymentFrequency = (selectedPaymentFrequency: string) => {
    this.selectedPaymentFrequency = selectedPaymentFrequency;
  };

  @action
  setIsSideBarCollapsed = (isSideBarCollapsed: boolean) => {
    this.isSideBarCollapsed = isSideBarCollapsed;
  };

  @action
  setIsErrorCoolDown = (isErrorCoolDown: boolean) => {
    this.isErrorCoolDown = isErrorCoolDown;
  };

  @action
  setIsCustomerLeaseModalOpen = (isCustomerLeaseModalOpen: boolean) => {
    this.isCustomerLeaseModalOpen = isCustomerLeaseModalOpen;
  };

  @action
  setIsIdCheckRequired = (isIdCheckRequired: boolean) => {
    this.isIdCheckRequired = isIdCheckRequired;
  };

  @action
  setIdCheckProvider = (idCheckProvider: string) => {
    this.idCheckProvider = idCheckProvider;
  };

  @action
  setServerTimeOffset = (serverTimeOffset: string) => {
    try {
      const serverTimeOffsetParsed = serverTimeOffset
        ? parseInt(serverTimeOffset)
        : 0;
      const nowUtcOffset = new Date().getTimezoneOffset();
      this.serverTimeOffset = serverTimeOffsetParsed - nowUtcOffset;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Unable to parse server time', e);
    }
  };

  @action
  setPhoneVerificationRequired = (phoneVerificationRequired: boolean): void => {
    this.phoneVerificationRequired = phoneVerificationRequired;
  };

  @action
  setLeadPk = (leadPk: number): void => {
    this.leadPk = leadPk;
  };

  @action
  setMissingFields = (missingFields: string[]): void => {
    this.missingFields = missingFields;
  };

  @action
  setFirstPaymentDate = (firstPaymentDate: string): void => {
    this.firstPaymentDate = formatDate({d: firstPaymentDate, f: 'api'});
  };

  @action
  setPaymentPrograms = (paymentPrograms: PaymentProgramData[]): void => {
    this.paymentPrograms = paymentPrograms;
  };

  @action
  setIsBankVerificationSubmitted = (
    isBankVerificationSubmitted: boolean,
  ): void => {
    this.isBankVerificationSubmitted = isBankVerificationSubmitted;
  };

  @action
  setIsBankVerificationRequired = (
    isBankVerificationRequired: boolean,
  ): void => {
    this.isBankVerificationRequired = isBankVerificationRequired;
  };

  @action
  setRecordSigningFlow = (recordSigningFlow: boolean): void => {
    this.recordSigningFlow = recordSigningFlow;
  };

  @action
  setItemPaymentSummary = (itemPaymentSummary: ItemPaymentSummary) => {
    this.itemPaymentSummary = itemPaymentSummary;
  };

  @action
  setBasicCutomerData = (basicCustomerData: any) => {
    this.basicCustomerData = basicCustomerData;
  };

  @action
  setSigningFeeExists = (signingFeeExists: boolean) => {
    this.signingFeeExists = signingFeeExists;
  };

  @action
  setSearchType = (searchType: SearchType): void => {
    this.searchType = searchType;
  };

  @action
  reset = (): void => {
    this.serverTimeOffset = 0;
    this.isLoading = false;
    this.alertModalMessage = '';
    this.missingFields = [];
    this.leadPk = null;
    this.uuid = '';
    this.achAutoPay = false;
    this.feeToBeCharged = null;
    this.isIdCheckRequired = false;
    this.idCheckProvider = '';
    this.securityDeposit = null;
    this.selectedPaymentFrequency = '';
    this.submitApplicationResponse = undefined;
    this.isCustomerLeaseModalOpen = false;
    this.merchant = '';
    this.isPaymentProgramModalOpen = false;
    this.phoneVerificationRequired = false;
    this.recordSigningFlow = false;
    this.signingFeeExists = false;
    this.searchType = SearchType['Lead #'];
  };
}



models/can-continue-application.ts
export type CanContinueApplication = {
  leadPk: number;
  leadFound: boolean;
  canContinueApplication: boolean;
  canContinuePlaid: boolean;
  verifyPhone: boolean;
  isApplicationApprovedOrBeyond?: boolean;
  merchantLocationName?: string;
  refMerchantCode?: string;
  customerFirstName?: string;
  uuid?: string;
};




models/get-missing-required-fields-params.ts
export interface GetMissingRequiredFieldsParams {
  uuid: string | string[];
  shortCode: string | string[];
  selectedPaymentFrequency?: string | string[];
}


pages/[shortCode]/complete/index.tsx
import IntellicheckToolkit from '@components/intellicheck-toolkit';
import ItemSplit from '@components/item-split';
import MissingDataPanel from '@components/missing-data-panel';
import MissingPaymentProgram from '@components/missing-payment-program';
import VerificationCancelledModal from '@components/modals/seon/seon-cancelled';
import SeonVerificationFailedModal from '@components/modals/seon/seon-failed';
import SeonVerificationComponent from '@components/seon/seonIdVerification';
import TermsOfAgreement from '@components/terms-of-agreement-form';
import VerificationMessage from '@components/verification-message';
import VerifyPhoneNumber from '@components/verify-phone-number';
import AdBlockDetectedModal from '@components/modals/adblock';
import NoAuthWrapper from '@layouts/no-auth';
import {GetMissingRequiredFieldsParams} from '@models';
import {CustomerStore} from '@stores/customer';
import {UtilityStore} from '@stores/utility';
import {
  handleKountSessionID,
  handlePostMessageCheck,
  loadKornerstoneTheme,
} from '@utils/helper';
import {isEqual, showToast} from '@uownleasing/common-utilities';

import * as Sentry from '@sentry/react';
import {useDetectAdBlock} from 'adblock-detect-react';
import $ from 'jquery';
import {inject, observer} from 'mobx-react';
import type {GetServerSideProps} from 'next';
import {useRouter} from 'next/router';
import Script from 'next/script';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {projectConfig} from '@config/project-config';

interface CompleteApplicationProps {
  utilityStore: UtilityStore;
  customerStore: CustomerStore;
  isLocalhost: boolean;
  isProd: boolean;
  clientID: string;
  SENTRY_DSN: string;
  NID: string;
  BUDDY_OFFER_CONFIG_URL: string;
  PARTNER_ID: string;
  SEON_LICENSE_KEY: string;
}

const CompleteApplication = ({
  customerStore,
  utilityStore,
  isLocalhost,
  isProd,
  clientID,
  SENTRY_DSN,
  NID,
  BUDDY_OFFER_CONFIG_URL,
  PARTNER_ID,
  SEON_LICENSE_KEY,
}: CompleteApplicationProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIntellicheckCompleted, setIsIntellicheckCompleted] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [showAdBlockModal, setShowAdBlockModal] = useState(false);
  const [isReinitializing, setIsReinitializing] = useState(false);
  const [isSeonCompleted, setIsSeonCompleted] = useState(false);
  const initializedRef = useRef(false);
  const [isIdVerificationPassed, setIsIdVerificationPassed] = useState(false);
  const [isMissingPayDates, setIsMissingPayDates] = useState(false);
  const [filteredMissingFields, setFilteredMissingFields] = useState([]);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [optionalAchText, setOptionalAchText] = useState<string[]>([]);
  const [merchantRefCode, setMerchantRefCode] = useState('');
  const [currentLeadPk, setCurrentLeadPk] = useState<number>(null);
  const [offerInsurance, setOfferInsurance] = useState(false);
  const [seonTouched, setSeonTouched] = useState(false);
  const [isKornerstoneCustomer, setIsKornerstoneCustomer] = useState(false);
  const config = useMemo(
    () => projectConfig(isKornerstoneCustomer),
    [isKornerstoneCustomer],
  );
  const adBlockDetected = useDetectAdBlock();

  useEffect(() => {
    if (!Sentry.getClient()) {
      try {
        // eslint-disable-next-line no-console
        console.log('S INIT()');
        Sentry.init({
          dsn: SENTRY_DSN,
          debug: false,
          environment: isProd ? 'production' : 'development',
          replaysOnErrorSampleRate: 0,
          replaysSessionSampleRate: 1.0,
          integrations: [],
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Sentry already init()', error);
      }
    }
  });

  const replayInit = () => {
    const replay = Sentry.getReplay();
    if (!replay) {
      try {
        const integration = Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
          maskAllInputs: false,
          minReplayDuration: 1000,
          stickySession: true,
          networkDetailAllowUrls: [
            window.location.origin,
            'https://ssl.kaptcha.com',
            'https://receiver.neuroid.cloud',
          ],
          networkRequestHeaders: ['X-Custom-Header'],
          networkResponseHeaders: ['X-Custom-Header'],
        });
        Sentry.addIntegration(integration);
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep init()');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep instance already exists', error);
      }
    } else {
      try {
        replay?.start();
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep start()');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep failed to start', error);
      }
    }
  };

  const getMissingRequiredFields = async (payFrequency = '') => {
    const payFreq = router?.query?.selectedPaymentFrequency || '';
    const selectedPaymentFrequency = payFrequency || payFreq || '';
    const getMissingRequiredFieldsRequest: GetMissingRequiredFieldsParams = {
      uuid: '',
      shortCode: router?.query?.shortCode || '',
      selectedPaymentFrequency: selectedPaymentFrequency,
    };
    const {data, message, status} = await utilityStore.getMissingRequiredFields(
      getMissingRequiredFieldsRequest,
    );

    if (data && status === 200) {
      const fName = data?.customerFirstName || '';
      const lName = data?.customerLastName || '';
      const hasName = fName || lName;
      const fullName = `${fName} ${lName}`;
      const text =
        typeof data?.optionalAchText === 'string'
          ? JSON.stringify(data.optionalAchText)
          : '';
      const optionalStrings = (text || '')?.split('\\n') || [];
      const stringsToDisplay = optionalStrings?.map((str) =>
        str?.replace(/["\\]/g, ''),
      );
      setOptionalAchText(stringsToDisplay);
      setCurrentLeadPk(data?.leadPk || null);

      Sentry?.setUser({
        id: data?.leadPk,
        username: hasName
          ? `${fullName} - ${data?.leadPk || ''}`
          : String(data?.leadPk),
      });

      if (data?.recordSigningFlow) {
        replayInit();
      }

      setMerchantRefCode(data?.merchantRefCode || '');

      setOfferInsurance(data?.isOfferInsuranceRequired);
    }

    if (data?.leadPk) {
      initializeCustomerInfo(data?.leadPk);
    }

    if (
      utilityStore?.missingFields.includes('lastPayDate') ||
      utilityStore?.missingFields.includes('nextPayDate') ||
      utilityStore?.missingFields.includes('payFrequency')
    ) {
      setIsMissingPayDates(true);
    } else {
      setIsMissingPayDates(false);
    }

    if (
      data?.idCheckPassed ||
      isLocalhost ||
      !utilityStore?.isIdCheckRequired
    ) {
      setIsIdVerificationPassed(true);
    }

    utilityStore.setIsLoading(false);
    if (status === 200) {
      setIsLoaded(true);
    } else {
      showToast('error', message);
    }
  };

  const initializeCustomerInfo = async (leadPk: number) => {
    await customerStore?.setAccountPk(leadPk);
    await customerStore?.getEmploymentInfo(leadPk);
  };

  useEffect(() => {
    utilityStore.setIsLoading(true);
    const shortCode = router?.query?.shortCode;
    if (shortCode) {
      getMissingRequiredFields();
    }
    setIsKornerstoneCustomer(loadKornerstoneTheme());
  }, [router?.query?.shortCode, utilityStore]);

  useEffect(() => {
    if (isIntellicheckCompleted) {
      utilityStore?.getIntellicheckResults();
    }
  }, [isIntellicheckCompleted]);

  const handleSubmitApplication = async (reqData: any) => {
    const submitApplicationResponse = await utilityStore?.submitApplication(
      reqData,
    );
    const {message, status} = submitApplicationResponse;

    const embeddedSigningUrl =
      utilityStore?.submitApplicationResponse?.embeddedSigningUrl || '';
    const isSignwell = embeddedSigningUrl?.includes('signwell') || false;

    const removeParentOrTopOnIframe =
      utilityStore?.submitApplicationResponse?.removeParentOrTopOnIframe ||
      false;

    const allowCloseOnIframe =
      utilityStore?.submitApplicationResponse?.allowCloseOnIframe || false;

    if (message) {
      showToast('error', message);
      if (status === 412) {
        utilityStore?.setIsLoading(true);
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          } else {
            router?.reload();
          }
        }, 2000);
      }
    } else if (isSignwell && embeddedSigningUrl) {
      const doesSignwellExist = $('#SignWell-Modal-Embedded').length > 0;

      // eslint-disable-next-line no-console
      console.log(
        'complete application pre-load $(#SignWell-Modal-Embedded)',
        $('#SignWell-Modal-Embedded'),
      );
      // eslint-disable-next-line no-console
      console.log(
        'complete application pre-load doesSignwellExist',
        doesSignwellExist,
      );

      if (!doesSignwellExist && document) {
        // eslint-disable-next-line no-console
        console.log('complete application pre-load appending script');
        const head = document.getElementsByTagName('head')[0];
        const script = document.createElement('script');
        script.src = 'https://static.signwell.com/assets/embedded.js';
        head.appendChild(script);
        // eslint-disable-next-line no-console
        console.log('complete application pre-load appended script');
      }

      // eslint-disable-next-line no-console
      console.log('removeParentOrTopOnIframe', removeParentOrTopOnIframe);
      // eslint-disable-next-line no-console
      console.log('allowCloseOnIframe', allowCloseOnIframe);

      // @ts-ignore
      // eslint-disable-next-line no-undef
      const signWellEmbed = new SignWellEmbed({
        allowClose: allowCloseOnIframe,
        iframeRedirect: removeParentOrTopOnIframe,
        events: {
          completed: async (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load completed event: ', e);
            const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
              'completed',
            );
            // eslint-disable-next-line no-console
            console.log('redirectUrl', redirectUrl);
          },
          closed: async (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load closed event: ', e);
            const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
              'closed',
            );
            // eslint-disable-next-line no-console
            console.log('redirectUrl', redirectUrl);
          },
          declined: async (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load declined event: ', e);
            const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
              'declined',
            );
            // eslint-disable-next-line no-console
            console.log('redirectUrl', redirectUrl);
          },
          error: (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load error event: ', e);
            showToast(
              'error',
              `Unable to retrieve document. Please try again or contact ${config.name} support at ${config.contactPhone}`,
            );
          },
        },
      });
      signWellEmbed.open();
      $('#SignWell-Modal-Embedded').addClass('d-none').removeClass('d-block');
    } else {
      // eslint-disable-next-line no-console
      console.log(
        'The following embeddedSigningUrl was received:',
        embeddedSigningUrl,
      );
      utilityStore?.setIsLoading(true);
      await router?.push('/landing-page');
      utilityStore?.setIsLoading(false);
    }

    return submitApplicationResponse;
  };

  const handleNext = async (req: {
    lastPayDate: string;
    nextPayDate: string;
    payFrequency: string;
  }) => {
    const response = await customerStore?.createOrUpdateEmployment({
      ...customerStore?.employmentInfo?.employmentInfo,
      lastPayDate: req?.lastPayDate,
      nextPayDate: req?.nextPayDate,
      payFrequency: req?.payFrequency,
    });

    if (!response) {
      utilityStore?.setIsLoading(true);
      await getMissingRequiredFields();
      utilityStore?.setIsLoading(false);
    }
  };

  useEffect(() => {
    let missingFields = utilityStore?.missingFields || [];
    missingFields = isMissingPayDates
      ? missingFields?.filter(
          (field) =>
            !isEqual(field, 'desiredPaymentFrequency') &&
            (isEqual(field, 'nextPayDate') ||
              isEqual(field, 'lastPayDate') ||
              isEqual(field, 'payFrequency')),
        )
      : missingFields?.filter(
          (field) => !isEqual(field, 'desiredPaymentFrequency'),
        );

    setFilteredMissingFields(missingFields);
  }, [utilityStore?.missingFields, isMissingPayDates]);

  const paymentProgramData = customerStore?.paymentProgramData || [];
  const getPaymentProgram = async () => {
    const leadPk = utilityStore?.leadPk || null;
    await customerStore?.getPaymentOptions(leadPk);
  };

  const missingPurchaseNowItems =
    utilityStore?.missingFields?.includes('purchaseNowItem');
  const missingDesiredPaymentFrequency = utilityStore?.missingFields?.includes(
    'desiredPaymentFrequency',
  );
  const isBankVerificationRequired = utilityStore?.isBankVerificationRequired;
  const redirectUrl = customerStore?.redirectUrl;

  useEffect(() => {
    if (utilityStore.recordSigningFlow) {
      const replayId = Sentry.getReplay()?.getReplayId();
      if (replayId && currentLeadPk) {
        const idSent = sessionStorage?.getItem('sentUuid');
        const isSameId = idSent && idSent === replayId;

        if (!isSameId) {
          // eslint-disable-next-line no-console
          console.log('handlerRecordId - sent replayId', replayId);
          customerStore?.storeRecordingInfo(currentLeadPk, replayId);
        }
      }

      if (!replayId) {
        replayInit();
      }
    }
  }, [currentLeadPk, customerStore, utilityStore.recordSigningFlow]);

  const handleSeonReinitialize = async () => {
    setIsReinitializing(true);
    try {
      setShowCancelledModal(false);
      setShowFailedModal(false);
      setTimeout(() => window.location.reload(), 100);
    } finally {
      setIsReinitializing(false);
    }
  };

  const handleCancelled = () => {
    setShowCancelledModal(true);
  };

  const handleFailed = () => {
    setShowFailedModal(true);
  };

  useEffect(() => {
    const handlePostMessageEvent = (event) => {
      if (event?.data === 'uown_success') {
        // eslint-disable-next-line no-console
        console.log(
          event?.data,
          ' was sent to top window from completeApplication page',
        );
      }
    };

    if (redirectUrl && !isLoading) {
      // eslint-disable-next-line no-console
      console.log('REDIRECTING...');
      showToast(
        'success',
        'Thank you for signing your lease. You will now be redirected...',
      );
      handlePostMessageCheck(
        redirectUrl,
        'Post Message sent on completeApplication page.',
      );
      utilityStore?.setIsLoading(true);

      if (typeof window !== 'undefined') {
        window.addEventListener('message', handlePostMessageEvent);
      }

      setTimeout(async () => {
        const integration = Sentry.getReplay();
        if (integration != null) {
          await integration.flush();
        } else {
          console.error('Rep flush failed integration reference is null');
        }
      }, 1000);

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }

    return () => window?.removeEventListener('message', handlePostMessageEvent);
  }, [redirectUrl]);

  useEffect(() => {
    setIsLoading(false);

    return () => {
      customerStore?.setRedirectUrl(undefined);
      utilityStore?.setSubmitApplicationResponse(undefined);
    };
  }, []);

  useEffect(() => {
    if (utilityStore.idCheckProvider === 'SEON' && adBlockDetected) {
      setShowAdBlockModal(true);
    }
  }, [adBlockDetected, utilityStore.idCheckProvider]);

  return (
    <NoAuthWrapper isContactBarHidden={true}>
      <VerificationCancelledModal
        isOpen={showCancelledModal}
        setIsOpen={setShowCancelledModal}
        onReinitialize={handleSeonReinitialize}
        isLoading={isReinitializing}
      />
      <SeonVerificationFailedModal
        isOpen={showFailedModal}
        setIsOpen={setShowFailedModal}
        onReinitialize={handleSeonReinitialize}
        isLoading={isReinitializing}
      />
      <AdBlockDetectedModal
        isOpen={showAdBlockModal}
        setIsOpen={setShowAdBlockModal}
        onReinitialize={handleSeonReinitialize}
        isLoading={isReinitializing}
      />
      {utilityStore?.isIdCheckRequired && !isIdVerificationPassed && (
        <>
          {utilityStore.idCheckProvider === 'SEON' && (
            <SeonVerificationComponent
              utilityStore={utilityStore}
              SEON_LICENSE_KEY={SEON_LICENSE_KEY}
              initializedRef={initializedRef}
              onCancelled={handleCancelled}
              onFailed={handleFailed}
              setIsSeonCompleted={setIsSeonCompleted}
              onVerificationEventTriggered={() => setSeonTouched(true)}
            />
          )}

          {utilityStore?.idCheckProvider === 'INTELLICHECK' && (
            <Script
              type="text/javascript"
              src="/IDN-UI-Toolkit/IDN-Base/IDN-Base.js"
            />
          )}
        </>
      )}
      <Script
        type="text/javascript"
        src="https://static.signwell.com/assets/embedded.js"
      />
      {utilityStore?.isBankVerificationSubmitted ? (
        <VerificationMessage
          title="Check Your Inbox"
          message={`Thank you for selecting ${config.fullName} to provide you with a
                simple Lease to Own payment program. To complete your purchase,
                please check your email for the next step.`}
          secondaryMessage="Don't see the email? Please check your spam folder."
        />
      ) : !isLoading &&
        utilityStore?.submitApplicationResponse &&
        utilityStore?.submitApplicationResponse?.embeddedSigningUrl ? (
        <TermsOfAgreement
          config={config}
          isProd={isProd}
          buddyOfferConfigURL={BUDDY_OFFER_CONFIG_URL}
          partnerID={PARTNER_ID}
          offerInsurance={offerInsurance}
          submitApplicationResponse={utilityStore?.submitApplicationResponse}
          embeddedSigningUrl={
            utilityStore?.submitApplicationResponse?.embeddedSigningUrl
          }
          getEsignRedirectUrlByLead={utilityStore?.getEsignRedirectUrlByLead}
          removeParentOrTopOnIframe={
            utilityStore?.submitApplicationResponse
              ?.removeParentOrTopOnIframe || false
          }
          allowCloseOnIframe={
            utilityStore?.submitApplicationResponse?.allowCloseOnIframe || false
          }
          utilityStore={utilityStore}
        />
      ) : (
        <div id="missingDataPanelContainer" className="h-100">
          {isLoaded &&
            !isIdVerificationPassed &&
            utilityStore?.isIdCheckRequired &&
            utilityStore?.idCheckProvider === 'INTELLICHECK' && (
              <IntellicheckToolkit
                setIsIntellicheckCompleted={setIsIntellicheckCompleted}
              />
            )}

          {utilityStore?.phoneVerificationRequired &&
          !phoneVerified &&
          isIdVerificationPassed ? (
            <VerifyPhoneNumber
              config={config}
              leadPk={utilityStore?.leadPk}
              verifyPhoneNumber={customerStore?.verifyPhoneBeforeSigning}
              setPhoneVerified={setPhoneVerified}
            />
          ) : (
            isLoaded &&
            (!utilityStore?.isIdCheckRequired ||
              (utilityStore?.idCheckProvider === 'SEON' &&
                (isSeonCompleted || seonTouched)) ||
              (utilityStore?.idCheckProvider === 'INTELLICHECK' &&
                isIntellicheckCompleted) ||
              isIdVerificationPassed) && (
              <>
                {!isMissingPayDates &&
                missingDesiredPaymentFrequency &&
                !isBankVerificationRequired ? (
                  <MissingPaymentProgram
                    paymentFrequencyData={paymentProgramData}
                    getPaymentProgram={getPaymentProgram}
                    setPaymentFrequency={async (payFreq) => {
                      await utilityStore?.setIsLoading(true);
                      await utilityStore?.setSelectedPaymentFrequency(payFreq);
                      await getMissingRequiredFields(payFreq);
                      await utilityStore?.setIsLoading(false);
                    }}
                  />
                ) : missingPurchaseNowItems ? (
                  <ItemSplit
                    utilityStore={utilityStore}
                    itemPaymentSummary={utilityStore?.itemPaymentSummary}
                    config={config}
                  />
                ) : (
                  <MissingDataPanel
                    config={config}
                    missingFields={filteredMissingFields}
                    authorizeCreditCard={utilityStore?.authorizeCreditCard}
                    achDiscount={utilityStore?.achDiscount || null}
                    feeToBeCharged={utilityStore?.feeToBeCharged || null}
                    securityDeposit={utilityStore?.securityDeposit || null}
                    signingFeeExists={utilityStore?.signingFeeExists}
                    submitApplication={
                      isMissingPayDates ? handleNext : handleSubmitApplication
                    }
                    isLoading={utilityStore?.isLoading}
                    setIsLoading={utilityStore?.setIsLoading}
                    firstPayDate={utilityStore?.firstPaymentDate}
                    utilityStore={utilityStore}
                    isMissingPayDates={isMissingPayDates}
                    handleKountSessionID={(formik, setSubmitted) =>
                      handleKountSessionID(
                        clientID,
                        isProd,
                        formik,
                        undefined,
                        setSubmitted,
                      )
                    }
                    itemPaymentSummary={utilityStore?.itemPaymentSummary}
                    leadPk={currentLeadPk}
                    optionalAchText={optionalAchText}
                    NID={NID}
                    merchantRefCode={merchantRefCode}
                  />
                )}
              </>
            )
          )}
        </div>
      )}
    </NoAuthWrapper>
  );
};

type Props = {
  isLocalhost: boolean;
  clientID: string;
  isProd: boolean;
  SENTRY_DSN: string;
  NID: string;
  PARTNER_ID: string;
  BUDDY_OFFER_CONFIG_URL: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => ({
  props: {
    isLocalhost: context?.req?.headers?.host?.includes('localhost') || false,
    isProd:
      context?.req?.headers?.host?.includes('prd') ||
      context?.req?.headers?.host?.includes('prod') ||
      context?.req?.headers?.host?.includes('merchant') ||
      false,
    clientID: process.env.KOUNTMID || null,
    SENTRY_DSN:
      process.env.SENTRY_DSN ||
      'https://8be28f7fbc68047b6933193afb61c007@o4506266512916480.ingest.sentry.io/4506266517766144',
    NID: process.env.NID || null,
    BUDDY_OFFER_CONFIG_URL:
      process.env.BUDDY_OFFER_CONFIG_URL ||
      'https://staging.embed.buddy.insure/aon/aon-purchaseprotection-config-react.js',
    SEON_LICENSE_KEY: process.env.SEON_LICENSE_KEY || null,
    ID_CHECK_PROVIDER: process.env.ID_CHECK_PROVIDER || '',
    PARTNER_ID: process.env.PARTNER_ID || 'p-buddytest',
  },
});

export default inject(
  'customerStore',
  'utilityStore',
)(observer(CompleteApplication));



pages/[shortCode]/finalize/index.tsx
import React from 'react';
import {CustomerStore} from '@stores/customer';
import {MerchantStore} from '@stores/merchant';
import {UtilityStore} from '@stores/utility';
import {inject, observer} from 'mobx-react';
import {GetServerSideProps} from 'next';
import {FinalizeApplication} from '@components/temp/finalizeApplication';

type Props = {
  isLocalhost: boolean;
  clientID: string;
  isProd: boolean;
  SENTRY_DSN: string;
  NID: string;
};

interface FinalizeApplicationProps {
  merchantStore: MerchantStore;
  utilityStore: UtilityStore;
  customerStore: CustomerStore;
  isLocalhost: boolean;
  isProd: boolean;
  clientID: string;
  SENTRY_DSN: string;
  NID: string;
}

const FinalizeApplicationPage = (props: FinalizeApplicationProps) => {
  return <FinalizeApplication {...props} />;
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => ({
  props: {
    isLocalhost: context?.req?.headers?.host?.includes('localhost') || false,
    isProd:
      context?.req?.headers?.host?.includes('prd') ||
      context?.req?.headers?.host?.includes('prod') ||
      context?.req?.headers?.host?.includes('merchant') ||
      false,
    clientID: process.env.KOUNTMID || null,
    SENTRY_DSN: process.env.SENTRY_DSN || null,
    NID: process.env.NID || null,
  },
});

export default inject(
  'customerStore',
  'utilityStore',
  'merchantStore',
)(observer(FinalizeApplicationPage));



pages/[shortCode]/send/index.tsx




pages/completeApplication/index.tsx
import IntellicheckToolkit from '@components/intellicheck-toolkit';
import ItemSplit from '@components/item-split';
import MissingDataPanel from '@components/missing-data-panel';
import MissingPaymentProgram from '@components/missing-payment-program';
import VerificationCancelledModal from '@components/modals/seon/seon-cancelled';
import SeonVerificationFailedModal from '@components/modals/seon/seon-failed';
import SeonVerificationComponent from '@components/seon/seonIdVerification';
import TermsOfAgreement from '@components/terms-of-agreement-form';
import VerificationMessage from '@components/verification-message';
import VerifyPhoneNumber from '@components/verify-phone-number';
import AdBlockDetectedModal from '@components/modals/adblock';
import NoAuthWrapper from '@layouts/no-auth';
import {GetMissingRequiredFieldsParams} from '@models';
import {CustomerStore} from '@stores/customer';
import {UtilityStore} from '@stores/utility';
import {
  handleKountSessionID,
  handlePostMessageCheck,
  loadKornerstoneTheme,
} from '@utils/helper';
import {isEqual, showToast} from '@uownleasing/common-utilities';

import * as Sentry from '@sentry/react';
import {useDetectAdBlock} from 'adblock-detect-react';
import $ from 'jquery';
import {inject, observer} from 'mobx-react';
import type {GetServerSideProps} from 'next';
import {useRouter} from 'next/router';
import Script from 'next/script';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {projectConfig} from '@config/project-config';

interface CompleteApplicationProps {
  utilityStore: UtilityStore;
  customerStore: CustomerStore;
  isLocalhost: boolean;
  isProd: boolean;
  clientID: string;
  SENTRY_DSN: string;
  NID: string;
  BUDDY_OFFER_CONFIG_URL: string;
  PARTNER_ID: string;
  SEON_LICENSE_KEY: string;
}

const CompleteApplication = ({
  customerStore,
  utilityStore,
  isLocalhost,
  isProd,
  clientID,
  SENTRY_DSN,
  NID,
  BUDDY_OFFER_CONFIG_URL,
  PARTNER_ID,
  SEON_LICENSE_KEY,
}: CompleteApplicationProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBranded, setIsBranded] = useState(false);

  const [isIntellicheckCompleted, setIsIntellicheckCompleted] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [showAdBlockModal, setShowAdBlockModal] = useState(false);
  const [isReinitializing, setIsReinitializing] = useState(false);
  const [isSeonCompleted, setIsSeonCompleted] = useState(false);
  const initializedRef = useRef(false);
  const [isIdVerificationPassed, setIsIdVerificationPassed] = useState(false);
  const [isMissingPayDates, setIsMissingPayDates] = useState(false);
  const [filteredMissingFields, setFilteredMissingFields] = useState([]);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [optionalAchText, setOptionalAchText] = useState<string[]>([]);
  const [merchantRefCode, setMerchantRefCode] = useState('');
  const [currentLeadPk, setCurrentLeadPk] = useState<number>(null);
  const [offerInsurance, setOfferInsurance] = useState(false);
  const [seonTouched, setSeonTouched] = useState(false);
  const [isKornerstoneCustomer, setIsKornerstoneCustomer] = useState(false);
  const config = useMemo(
    () => projectConfig(isKornerstoneCustomer),
    [isKornerstoneCustomer],
  );
  const adBlockDetected = useDetectAdBlock();

  const isTargetFlagPresent = (name: string) => {
    return (router?.query?.[name] || '') === 'true';
  };

  useEffect(() => {
    if (!Sentry.getClient()) {
      try {
        // eslint-disable-next-line no-console
        console.log('S INIT()');
        Sentry.init({
          dsn: SENTRY_DSN,
          debug: false,
          environment: isProd ? 'production' : 'development',
          replaysOnErrorSampleRate: 0,
          replaysSessionSampleRate: 1.0,
          integrations: [],
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Sentry already init()', error);
      }
    }
  });

  const replayInit = () => {
    const replay = Sentry.getReplay();
    if (!replay) {
      try {
        const integration = Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
          maskAllInputs: false,
          minReplayDuration: 1000,
          stickySession: true,
          networkDetailAllowUrls: [
            window.location.origin,
            'https://ssl.kaptcha.com',
            'https://receiver.neuroid.cloud',
          ],
          networkRequestHeaders: ['X-Custom-Header'],
          networkResponseHeaders: ['X-Custom-Header'],
        });
        Sentry.addIntegration(integration);
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep init()');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep instance already exists', error);
      }
    } else {
      try {
        replay?.start();
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep start()');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('handlerRecordId', 'Rep failed to start', error);
      }
    }
  };

  const getMissingRequiredFields = async (payFrequency = '') => {
    setIsBranded(isTargetFlagPresent('isBranded'));
    const payFreq = router?.query?.selectedPaymentFrequency || '';
    const selectedPaymentFrequency = payFrequency || payFreq || '';
    const getMissingRequiredFieldsRequest: GetMissingRequiredFieldsParams = {
      uuid: router?.query?.uuid || '',
      shortCode: '',
      selectedPaymentFrequency: selectedPaymentFrequency,
    };
    const {data, message, status} = await utilityStore.getMissingRequiredFields(
      getMissingRequiredFieldsRequest,
    );

    if (data && status === 200) {
      const fName = data?.customerFirstName || '';
      const lName = data?.customerLastName || '';
      const hasName = fName || lName;
      const fullName = `${fName} ${lName}`;
      const text =
        typeof data?.optionalAchText === 'string'
          ? JSON.stringify(data.optionalAchText)
          : '';
      const optionalStrings = (text || '')?.split('\\n') || [];
      const stringsToDisplay = optionalStrings?.map((str) =>
        str?.replace(/["\\]/g, ''),
      );
      setOptionalAchText(stringsToDisplay);
      setCurrentLeadPk(data?.leadPk || null);

      Sentry?.setUser({
        id: data?.leadPk,
        username: hasName
          ? `${fullName} - ${data?.leadPk || ''}`
          : String(data?.leadPk),
      });

      if (data?.recordSigningFlow) {
        replayInit();
      }

      setMerchantRefCode(data?.merchantRefCode || '');

      setOfferInsurance(data?.isOfferInsuranceRequired);
    }

    if (data?.leadPk) {
      initializeCustomerInfo(data?.leadPk);
    }

    if (
      utilityStore?.missingFields.includes('lastPayDate') ||
      utilityStore?.missingFields.includes('nextPayDate') ||
      utilityStore?.missingFields.includes('payFrequency')
    ) {
      setIsMissingPayDates(true);
    } else {
      setIsMissingPayDates(false);
    }

    if (
      data?.idCheckPassed ||
      isLocalhost ||
      !utilityStore?.isIdCheckRequired
    ) {
      setIsIdVerificationPassed(true);
    }

    utilityStore.setIsLoading(false);
    if (status === 200) {
      setIsLoaded(true);
    } else {
      showToast('error', message);
    }
  };

  const initializeCustomerInfo = async (leadPk: number) => {
    await customerStore?.setAccountPk(leadPk);
    await customerStore?.getEmploymentInfo(leadPk);
  };

  useEffect(() => {
    utilityStore.setIsLoading(true);
    const UUID = router?.query?.uuid;
    if (UUID) {
      getMissingRequiredFields();
    }
    setIsKornerstoneCustomer(loadKornerstoneTheme());
  }, [router?.query?.uuid, utilityStore]);

  useEffect(() => {
    if (isIntellicheckCompleted) {
      utilityStore?.getIntellicheckResults();
    }
  }, [isIntellicheckCompleted]);

  const handleSubmitApplication = async (reqData: any) => {
    const submitApplicationResponse = await utilityStore?.submitApplication(
      reqData,
    );
    const {message, status} = submitApplicationResponse;

    const embeddedSigningUrl =
      utilityStore?.submitApplicationResponse?.embeddedSigningUrl || '';
    const isSignwell = embeddedSigningUrl?.includes('signwell') || false;

    const removeParentOrTopOnIframe =
      utilityStore?.submitApplicationResponse?.removeParentOrTopOnIframe ||
      false;

    const allowCloseOnIframe =
      utilityStore?.submitApplicationResponse?.allowCloseOnIframe || false;

    if (message) {
      showToast('error', message);
      if (status === 412) {
        utilityStore?.setIsLoading(true);
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          } else {
            router?.reload();
          }
        }, 2000);
      }
    } else if (isSignwell && embeddedSigningUrl) {
      const doesSignwellExist = $('#SignWell-Modal-Embedded').length > 0;

      // eslint-disable-next-line no-console
      console.log(
        'complete application pre-load $(#SignWell-Modal-Embedded)',
        $('#SignWell-Modal-Embedded'),
      );
      // eslint-disable-next-line no-console
      console.log(
        'complete application pre-load doesSignwellExist',
        doesSignwellExist,
      );

      if (!doesSignwellExist && document) {
        // eslint-disable-next-line no-console
        console.log('complete application pre-load appending script');
        const head = document.getElementsByTagName('head')[0];
        const script = document.createElement('script');
        script.src = 'https://static.signwell.com/assets/embedded.js';
        head.appendChild(script);
        // eslint-disable-next-line no-console
        console.log('complete application pre-load appended script');
      }

      // eslint-disable-next-line no-console
      console.log('removeParentOrTopOnIframe', removeParentOrTopOnIframe);
      // eslint-disable-next-line no-console
      console.log('allowCloseOnIframe', allowCloseOnIframe);

      // @ts-ignore
      // eslint-disable-next-line no-undef
      const signWellEmbed = new SignWellEmbed({
        allowClose: allowCloseOnIframe,
        iframeRedirect: removeParentOrTopOnIframe,
        events: {
          completed: async (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load completed event: ', e);
            const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
              'completed',
            );
            // eslint-disable-next-line no-console
            console.log('redirectUrl', redirectUrl);
          },
          closed: async (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load closed event: ', e);
            const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
              'closed',
            );
            // eslint-disable-next-line no-console
            console.log('redirectUrl', redirectUrl);
          },
          declined: async (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load declined event: ', e);
            const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
              'declined',
            );
            // eslint-disable-next-line no-console
            console.log('redirectUrl', redirectUrl);
          },
          error: (e) => {
            // eslint-disable-next-line no-console
            console.log('complete application pre-load error event: ', e);
            showToast(
              'error',
              `Unable to retrieve document. Please try again or contact ${config.name} support at ${config.contactPhone}`,
            );
          },
        },
      });
      signWellEmbed.open();
      $('#SignWell-Modal-Embedded').addClass('d-none').removeClass('d-block');
    } else {
      // eslint-disable-next-line no-console
      console.log(
        'The following embeddedSigningUrl was received:',
        embeddedSigningUrl,
      );
      utilityStore?.setIsLoading(true);
      await router?.push('/landing-page');
      utilityStore?.setIsLoading(false);
    }

    return submitApplicationResponse;
  };

  const handleNext = async (req: {
    lastPayDate: string;
    nextPayDate: string;
    payFrequency: string;
  }) => {
    const response = await customerStore?.createOrUpdateEmployment({
      ...customerStore?.employmentInfo?.employmentInfo,
      lastPayDate: req?.lastPayDate,
      nextPayDate: req?.nextPayDate,
      payFrequency: req?.payFrequency,
    });

    if (!response) {
      utilityStore?.setIsLoading(true);
      await getMissingRequiredFields();
      utilityStore?.setIsLoading(false);
    }
  };

  useEffect(() => {
    let missingFields = utilityStore?.missingFields || [];
    missingFields = isMissingPayDates
      ? missingFields?.filter(
          (field) =>
            !isEqual(field, 'desiredPaymentFrequency') &&
            (isEqual(field, 'nextPayDate') ||
              isEqual(field, 'lastPayDate') ||
              isEqual(field, 'payFrequency')),
        )
      : missingFields?.filter(
          (field) => !isEqual(field, 'desiredPaymentFrequency'),
        );

    setFilteredMissingFields(missingFields);
  }, [utilityStore?.missingFields, isMissingPayDates]);

  const paymentProgramData = customerStore?.paymentProgramData || [];
  const getPaymentProgram = async () => {
    const leadPk = utilityStore?.leadPk || null;
    await customerStore?.getPaymentOptions(leadPk);
  };

  const missingPurchaseNowItems =
    utilityStore?.missingFields?.includes('purchaseNowItem');
  const missingDesiredPaymentFrequency = utilityStore?.missingFields?.includes(
    'desiredPaymentFrequency',
  );
  const isBankVerificationRequired = utilityStore?.isBankVerificationRequired;
  const redirectUrl = customerStore?.redirectUrl;

  useEffect(() => {
    if (utilityStore.recordSigningFlow) {
      const replayId = Sentry.getReplay()?.getReplayId();
      if (replayId && currentLeadPk) {
        const idSent = sessionStorage?.getItem('sentUuid');
        const isSameId = idSent && idSent === replayId;

        if (!isSameId) {
          // eslint-disable-next-line no-console
          console.log('handlerRecordId - sent replayId', replayId);
          customerStore?.storeRecordingInfo(currentLeadPk, replayId);
        }
      }

      if (!replayId) {
        replayInit();
      }
    }
  }, [currentLeadPk, customerStore, utilityStore.recordSigningFlow]);

  const handleSeonReinitialize = async () => {
    setIsReinitializing(true);
    try {
      setShowCancelledModal(false);
      setShowFailedModal(false);
      setTimeout(() => window.location.reload(), 100);
    } finally {
      setIsReinitializing(false);
    }
  };

  const handleCancelled = () => {
    setShowCancelledModal(true);
  };

  const handleFailed = () => {
    setShowFailedModal(true);
  };

  useEffect(() => {
    const handlePostMessageEvent = (event) => {
      if (event?.data === 'uown_success') {
        // eslint-disable-next-line no-console
        console.log(
          event?.data,
          ' was sent to top window from completeApplication page',
        );
      }
    };

    if (redirectUrl && !isLoading) {
      // eslint-disable-next-line no-console
      console.log('REDIRECTING...');
      showToast(
        'success',
        'Thank you for signing your lease. You will now be redirected...',
      );
      handlePostMessageCheck(
        redirectUrl,
        'Post Message sent on completeApplication page.',
      );
      utilityStore?.setIsLoading(true);

      if (typeof window !== 'undefined') {
        window.addEventListener('message', handlePostMessageEvent);
      }

      setTimeout(async () => {
        const integration = Sentry.getReplay();
        if (integration != null) {
          await integration.flush();
        } else {
          console.error('Rep flush failed integration reference is null');
        }
      }, 1000);

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }

    return () => window?.removeEventListener('message', handlePostMessageEvent);
  }, [redirectUrl]);

  useEffect(() => {
    setIsLoading(false);

    return () => {
      customerStore?.setRedirectUrl(undefined);
      utilityStore?.setSubmitApplicationResponse(undefined);
    };
  }, []);

  useEffect(() => {
    if (utilityStore.idCheckProvider === 'SEON' && adBlockDetected) {
      setShowAdBlockModal(true);
    }
  }, [adBlockDetected, utilityStore.idCheckProvider]);

  return (
    <NoAuthWrapper isContactBarHidden={!isBranded} isNavbarShown={isBranded}>
      <VerificationCancelledModal
        isOpen={showCancelledModal}
        setIsOpen={setShowCancelledModal}
        onReinitialize={handleSeonReinitialize}
        isLoading={isReinitializing}
      />
      <SeonVerificationFailedModal
        isOpen={showFailedModal}
        setIsOpen={setShowFailedModal}
        onReinitialize={handleSeonReinitialize}
        isLoading={isReinitializing}
      />
      <AdBlockDetectedModal
        isOpen={showAdBlockModal}
        setIsOpen={setShowAdBlockModal}
        onReinitialize={handleSeonReinitialize}
        isLoading={isReinitializing}
      />
      {utilityStore?.isIdCheckRequired && !isIdVerificationPassed && (
        <>
          {utilityStore.idCheckProvider === 'SEON' && (
            <SeonVerificationComponent
              utilityStore={utilityStore}
              SEON_LICENSE_KEY={SEON_LICENSE_KEY}
              initializedRef={initializedRef}
              onCancelled={handleCancelled}
              onFailed={handleFailed}
              setIsSeonCompleted={setIsSeonCompleted}
              onVerificationEventTriggered={() => setSeonTouched(true)}
            />
          )}

          {utilityStore?.idCheckProvider === 'INTELLICHECK' && (
            <Script
              type="text/javascript"
              src="/IDN-UI-Toolkit/IDN-Base/IDN-Base.js"
            />
          )}
        </>
      )}
      <Script
        type="text/javascript"
        src="https://static.signwell.com/assets/embedded.js"
      />
      {utilityStore?.isBankVerificationSubmitted ? (
        <VerificationMessage
          title="Check Your Inbox"
          message={`Thank you for selecting ${config.fullName} to provide you with a
                simple Lease to Own payment program. To complete your purchase,
                please check your email for the next step.`}
          secondaryMessage="Don't see the email? Please check your spam folder."
        />
      ) : !isLoading &&
        utilityStore?.submitApplicationResponse &&
        utilityStore?.submitApplicationResponse?.embeddedSigningUrl ? (
        <TermsOfAgreement
          config={config}
          isProd={isProd}
          buddyOfferConfigURL={BUDDY_OFFER_CONFIG_URL}
          partnerID={PARTNER_ID}
          offerInsurance={offerInsurance}
          submitApplicationResponse={utilityStore?.submitApplicationResponse}
          embeddedSigningUrl={
            utilityStore?.submitApplicationResponse?.embeddedSigningUrl
          }
          getEsignRedirectUrlByLead={utilityStore?.getEsignRedirectUrlByLead}
          removeParentOrTopOnIframe={
            utilityStore?.submitApplicationResponse
              ?.removeParentOrTopOnIframe || false
          }
          allowCloseOnIframe={
            utilityStore?.submitApplicationResponse?.allowCloseOnIframe || false
          }
          utilityStore={utilityStore}
        />
      ) : (
        <div id="missingDataPanelContainer" className="h-100">
          {isLoaded &&
            !isIdVerificationPassed &&
            utilityStore?.isIdCheckRequired &&
            utilityStore?.idCheckProvider === 'INTELLICHECK' && (
              <IntellicheckToolkit
                setIsIntellicheckCompleted={setIsIntellicheckCompleted}
              />
            )}

          {utilityStore?.phoneVerificationRequired &&
          !phoneVerified &&
          isIdVerificationPassed ? (
            <VerifyPhoneNumber
              config={config}
              leadPk={utilityStore?.leadPk}
              verifyPhoneNumber={customerStore?.verifyPhoneBeforeSigning}
              setPhoneVerified={setPhoneVerified}
            />
          ) : (
            isLoaded &&
            (!utilityStore?.isIdCheckRequired ||
              (utilityStore?.idCheckProvider === 'SEON' &&
                (isSeonCompleted || seonTouched)) ||
              (utilityStore?.idCheckProvider === 'INTELLICHECK' &&
                isIntellicheckCompleted) ||
              isIdVerificationPassed) && (
              <>
                {!isMissingPayDates &&
                missingDesiredPaymentFrequency &&
                !isBankVerificationRequired ? (
                  <MissingPaymentProgram
                    paymentFrequencyData={paymentProgramData}
                    getPaymentProgram={getPaymentProgram}
                    setPaymentFrequency={async (payFreq) => {
                      await utilityStore?.setIsLoading(true);
                      await utilityStore?.setSelectedPaymentFrequency(payFreq);
                      await getMissingRequiredFields(payFreq);
                      await utilityStore?.setIsLoading(false);
                    }}
                  />
                ) : missingPurchaseNowItems ? (
                  <ItemSplit
                    utilityStore={utilityStore}
                    itemPaymentSummary={utilityStore?.itemPaymentSummary}
                    config={config}
                  />
                ) : (
                  <MissingDataPanel
                    config={config}
                    missingFields={filteredMissingFields}
                    authorizeCreditCard={utilityStore?.authorizeCreditCard}
                    achDiscount={utilityStore?.achDiscount || null}
                    feeToBeCharged={utilityStore?.feeToBeCharged || null}
                    securityDeposit={utilityStore?.securityDeposit || null}
                    signingFeeExists={utilityStore?.signingFeeExists}
                    submitApplication={
                      isMissingPayDates ? handleNext : handleSubmitApplication
                    }
                    isLoading={utilityStore?.isLoading}
                    setIsLoading={utilityStore?.setIsLoading}
                    firstPayDate={utilityStore?.firstPaymentDate}
                    utilityStore={utilityStore}
                    isMissingPayDates={isMissingPayDates}
                    handleKountSessionID={(formik, setSubmitted) =>
                      handleKountSessionID(
                        clientID,
                        isProd,
                        formik,
                        undefined,
                        setSubmitted,
                      )
                    }
                    itemPaymentSummary={utilityStore?.itemPaymentSummary}
                    leadPk={currentLeadPk}
                    optionalAchText={optionalAchText}
                    NID={NID}
                    merchantRefCode={merchantRefCode}
                  />
                )}
              </>
            )
          )}
        </div>
      )}
    </NoAuthWrapper>
  );
};

type Props = {
  isLocalhost: boolean;
  clientID: string;
  isProd: boolean;
  SENTRY_DSN: string;
  NID: string;
  PARTNER_ID: string;
  BUDDY_OFFER_CONFIG_URL: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => ({
  props: {
    isLocalhost: context?.req?.headers?.host?.includes('localhost') || false,
    isProd:
      context?.req?.headers?.host?.includes('prd') ||
      context?.req?.headers?.host?.includes('prod') ||
      context?.req?.headers?.host?.includes('merchant') ||
      false,
    clientID: process.env.KOUNTMID || null,
    SENTRY_DSN:
      process.env.SENTRY_DSN ||
      'https://8be28f7fbc68047b6933193afb61c007@o4506266512916480.ingest.sentry.io/4506266517766144',
    NID: process.env.NID || null,
    BUDDY_OFFER_CONFIG_URL:
      process.env.BUDDY_OFFER_CONFIG_URL ||
      'https://staging.embed.buddy.insure/aon/aon-purchaseprotection-config-react.js',
    SEON_LICENSE_KEY: process.env.SEON_LICENSE_KEY || null,
    ID_CHECK_PROVIDER: process.env.ID_CHECK_PROVIDER || '',
    PARTNER_ID: process.env.PARTNER_ID || 'p-buddytest',
  },
});

export default inject(
  'customerStore',
  'utilityStore',
)(observer(CompleteApplication));



pages/completeEsign/index.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {inject, observer} from 'mobx-react';
import {UtilityStore} from '@stores/utility';
import NoAuthWrapper from '@layouts/no-auth';
import {CustomerStore} from '@stores/customer';
import Script from 'next/script';
import {useRouter} from 'next/router';
import VerifyPhoneNumber from '@components/verify-phone-number';
import {showToast} from '@uownleasing/common-utilities';
import $ from 'jquery';
import {EsignContractBody} from '@models';
import MissingPaymentProgram from '@components/missing-payment-program';
import TermsOfAgreement from '@components/terms-of-agreement-form';
import config from '@config/project-config';

interface CompleteEsignProps {
  customerStore: CustomerStore;
  utilityStore: UtilityStore;
}

const CompleteEsign = (props: CompleteEsignProps) => {
  const {customerStore, utilityStore} = props;
  const [phoneVerified, setPhoneVerified] = useState(false);
  const router = useRouter();
  const leadPk = utilityStore?.leadPk || null;
  const uuid = router?.query?.uuid;
  const shortCode = router?.query?.shortCode;
  const stringShortCode: string =
    (typeof shortCode === 'string' && shortCode) || '';
  const stringUuid: string = (typeof uuid === 'string' && uuid) || '';
  const fpd = utilityStore?.firstPaymentDate || '';
  const frequency = utilityStore?.selectedPaymentFrequency || '';

  const getEsignFields = async () => {
    if (stringUuid) {
      const response = await utilityStore?.getEsignFields(
        stringUuid,
        stringShortCode,
      );
      const {status, message} = response;

      if (status !== 200) {
        showToast(
          'error',
          message ||
            'An error has occurred. Please contact UOwn customer support if the problem persist.',
        );
      }
    }
  };

  const handleGenerateEsignContract = async () => {
    const body: EsignContractBody = {
      leadPk: utilityStore?.leadPk || null,
      desiredPaymentFrequency: frequency,
      firstPaymentDate: fpd,
    };
    const response = await utilityStore?.generateEsignContract(body);
    const {status, message} = response;
    if (status === 200) {
      const embeddedSigningUrl =
        utilityStore?.submitApplicationResponse?.embeddedSigningUrl || '';
      const isSignwell = embeddedSigningUrl?.includes('signwell') || false;
      const removeParentOrTopOnIframe =
        utilityStore?.submitApplicationResponse?.removeParentOrTopOnIframe ||
        false;
      const allowCloseOnIframe =
        utilityStore?.submitApplicationResponse?.allowCloseOnIframe || false;

      if (isSignwell && embeddedSigningUrl) {
        const doesSignwellExist = $('#SignWell-Modal-Embedded').length > 0;

        // eslint-disable-next-line no-console
        console.log(
          'complete application pre-load $(#SignWell-Modal-Embedded)',
          $('#SignWell-Modal-Embedded'),
        );
        // eslint-disable-next-line no-console
        console.log(
          'complete application pre-load doesSignwellExist',
          doesSignwellExist,
        );

        if (!doesSignwellExist && document) {
          // eslint-disable-next-line no-console
          console.log('complete application pre-load appending script');
          const head = document.getElementsByTagName('head')[0];
          const script = document.createElement('script');
          script.src = 'https://static.signwell.com/assets/embedded.js';
          head.appendChild(script);
          // eslint-disable-next-line no-console
          console.log('complete application pre-load appended script');
        }

        // eslint-disable-next-line no-console
        console.log('removeParentOrTopOnIframe', removeParentOrTopOnIframe);
        // eslint-disable-next-line no-console
        console.log('allowCloseOnIframe', allowCloseOnIframe);

        // @ts-ignore
        // eslint-disable-next-line no-undef
        const signWellEmbed = new SignWellEmbed({
          allowClose: allowCloseOnIframe,
          iframeRedirect: removeParentOrTopOnIframe,
          events: {
            completed: async (e) => {
              // eslint-disable-next-line no-console
              console.log('complete application pre-load completed event: ', e);
              const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
                'completed',
              );
              // eslint-disable-next-line no-console
              console.log('redirectUrl', redirectUrl);

              if (redirectUrl) {
                showToast(
                  'success',
                  'Thank you for signing your lease. You will now be redirected...',
                );
                window.location.href = redirectUrl;
              } else {
                // eslint-disable-next-line no-console
                console.log(
                  'No redirect url returned so no redirect will happen from our end',
                );
              }
            },
            closed: async (e) => {
              // eslint-disable-next-line no-console
              console.log('complete application pre-load closed event: ', e);
              const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
                'closed',
              );
              // eslint-disable-next-line no-console
              console.log('redirectUrl', redirectUrl);
            },
            declined: async (e) => {
              // eslint-disable-next-line no-console
              console.log('complete application pre-load declined event: ', e);
              const redirectUrl = await utilityStore?.getEsignRedirectUrlByLead(
                'declined',
              );
              // eslint-disable-next-line no-console
              console.log('redirectUrl', redirectUrl);

              if (redirectUrl) {
                showToast('success', 'You will now be redirected...');
                window.location.href = redirectUrl;
              } else {
                // eslint-disable-next-line no-console
                console.log(
                  'No redirect url returned so no redirect will happen from our end',
                );
              }
            },
          },
        });
        signWellEmbed.open();
        $('#SignWell-Modal-Embedded').addClass('d-none').removeClass('d-block');
      }
    } else {
      showToast(
        'error',
        message ||
          'An error has occurred. Please contact UOwn customer support if the problem persist.',
      );
    }
  };

  useEffect(() => {
    getEsignFields();
  }, [uuid]);

  const selectPaymentProgramStep =
    utilityStore?.paymentPrograms && utilityStore?.paymentPrograms?.length > 0;

  useEffect(() => {
    if (fpd && frequency) {
      utilityStore?.setPaymentPrograms([]);
      handleGenerateEsignContract();
    }
  }, [fpd, frequency]);

  const resetStore = useCallback(() => {
    utilityStore?.setSelectedPaymentFrequency('');
    utilityStore?.setFirstPaymentDate('');
    utilityStore?.setSubmitApplicationResponse(undefined);
    utilityStore?.setPhoneVerificationRequired(false);
    utilityStore?.setLeadPk(null);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('unload', resetStore);
    }
  }, []);

  return (
    <NoAuthWrapper isContactBarHidden>
      <Script
        type="text/javascript"
        src="https://static.signwell.com/assets/embedded.js"
      />
      {!phoneVerified && (
        <VerifyPhoneNumber
          leadPk={leadPk}
          verifyPhoneNumber={customerStore?.verifyPhoneBeforeSigning}
          setPhoneVerified={setPhoneVerified}
          config={config}
        />
      )}

      {selectPaymentProgramStep && !(fpd && frequency) && phoneVerified && (
        <MissingPaymentProgram
          paymentFrequencyData={utilityStore?.paymentPrograms}
          setPaymentFrequency={utilityStore?.setSelectedPaymentFrequency}
          setFirstPaymentDate={utilityStore?.setFirstPaymentDate}
        />
      )}

      {utilityStore?.submitApplicationResponse &&
        utilityStore?.submitApplicationResponse?.embeddedSigningUrl &&
        !selectPaymentProgramStep && (
          <TermsOfAgreement
            config={config}
            submitApplicationResponse={utilityStore?.submitApplicationResponse}
            embeddedSigningUrl={
              utilityStore?.submitApplicationResponse?.embeddedSigningUrl
            }
            getEsignRedirectUrlByLead={utilityStore?.getEsignRedirectUrlByLead}
            removeParentOrTopOnIframe={
              utilityStore?.submitApplicationResponse
                ?.removeParentOrTopOnIframe || false
            }
            allowCloseOnIframe={
              utilityStore?.submitApplicationResponse?.allowCloseOnIframe ||
              false
            }
            isProd={false}
            offerInsurance={false}
            utilityStore={utilityStore}
            buddyOfferConfigURL={''}
            partnerID={''}
          />
        )}
    </NoAuthWrapper>
  );
};

export default inject('customerStore', 'utilityStore')(observer(CompleteEsign));



pages/finalizeApplication/index.tsx
import React from 'react';
import {inject, observer} from 'mobx-react';
import {UtilityStore} from '@stores/utility';
import {CustomerStore} from '@stores/customer';
import type {GetServerSideProps} from 'next';
import {MerchantStore} from '@stores/merchant';
import {FinalizeApplication} from '@components/temp/finalizeApplication';

interface FinalizeApplicationProps {
  merchantStore: MerchantStore;
  utilityStore: UtilityStore;
  customerStore: CustomerStore;
  isLocalhost: boolean;
  isProd: boolean;
  clientID: string;
  SENTRY_DSN: string;
  NID: string;
}

const FinalizeApplicationPage = (props: FinalizeApplicationProps) => {
  return <FinalizeApplication {...props} />;
};

type Props = {
  isLocalhost: boolean;
  clientID: string;
  isProd: boolean;
  SENTRY_DSN: string;
  NID: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => ({
  props: {
    isLocalhost: context?.req?.headers?.host?.includes('localhost') || false,
    isProd:
      context?.req?.headers?.host?.includes('prd') ||
      context?.req?.headers?.host?.includes('prod') ||
      context?.req?.headers?.host?.includes('merchant') ||
      false,
    clientID: process.env.KOUNTMID || null,
    SENTRY_DSN: process.env.SENTRY_DSN || null,
    NID: process.env.NID || null,
  },
});

export default inject(
  'customerStore',
  'utilityStore',
  'merchantStore',
)(observer(FinalizeApplicationPage));



pages/sendApplication/[shortCode].tsx
import React from 'react';
import type {GetServerSideProps} from 'next';
import dynamic from 'next/dynamic';
import {SendApplication} from '@components/temp/sendApplication';

const SendApplicationPage = (props: Props) => {
  return <SendApplication {...props} />;
};

type Props = {
  NID: string;
  RADAR_LICENSE_KEY: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async () => ({
  props: {
    NID: process.env.NID_NEW_APPLICATION || '',
    RADAR_LICENSE_KEY: process.env.RADAR_LICENSE_KEY || '',
  },
});

export default dynamic(() => Promise.resolve(SendApplicationPage), {
  ssr: false,
});




pages/sendApplication/index.tsx
import React from 'react';
import type {GetServerSideProps} from 'next';
import dynamic from 'next/dynamic';
import {SendApplication} from '@components/temp/sendApplication';

const Application = (props: Props) => {
  return <SendApplication {...props} />;
};

type Props = {
  NID: string;
  RADAR_LICENSE_KEY: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async () => ({
  props: {
    NID: process.env.NID_NEW_APPLICATION || '',
    RADAR_LICENSE_KEY: process.env.RADAR_LICENSE_KEY || '',
  },
});

export default dynamic(() => Promise.resolve(Application), {
  ssr: false,
});

---------------------------------------------------------------------------------------------------------------------------------------------------------

  Cenário: Fluxo Send Application com URL antiga permanece funcional
    Quando a URL "origination-{env}.uowleansing.com/sendApplication?uuid={uuid}&paymentFrequency={frequency}" é acessada
    Então o fluxo de envio é carregado com sucesso
    E o tema corresponde ao domínio acessado
    E o template de comunicação correto é disparado
94449

  Cenário: Fluxo Send Application com nova URL curta por domínio
    Quando a URL "apply-{env}.<domínio-brand>/ {shortCode}/send" é acessada
    Então o fluxo de envio é carregado com sucesso
    E o tema corresponde ao domínio (Uown ou Kornerstone)
    E os templates de e-mail/SMS usam a nova URL curta
94450

  Cenário: Fluxo Finalize Application usando URL antiga
    Quando a URL "origination-{env}.uowleansing.com/finalizeApplication?uuid={uuid}&paymentFrequency={frequency}" é acessada
    Então o estado da aplicação é recuperado e exibido
    E o tema corresponde ao domínio
94445

  Cenário: Fluxo Finalize Application usando nova URL curta
    Quando a URL "secure-{env}.<domínio-brand>/{shortCode}/finalize" é acessada
    Então o estado da aplicação é recuperado e exibido
    E o tema corresponde ao domínio
94446

  Cenário: Fluxo Complete Application usando URL antiga
    Quando a URL "origination-{env}.uowleansing.com/completeApplication?uuid={uuid}&paymentFrequency={frequency}" é acessada
    Então o fluxo conclui a aplicação sem erros
    E as comunicações finais são enviadas com o template correto

  Cenário: Fluxo Complete Application usando nova URL curta
    Quando a URL "secure-{env}.<domínio-brand>/{shortCode}/complete" é acessada
    Então o fluxo conclui a aplicação sem erros
    E o redirecionamento final/assinatura eletrônica ocorre com a URL correta
    E o tema corresponde ao domínio

  Cenário: Resolução de lead via shortCode
    Dado um shortCode existente
    Quando a API de continuidade é chamada com shortCode
    Então leadFound é verdadeiro e leadPk é retornado

  Cenário: Branding isolado por domínio
    Quando a aplicação é acessada por um domínio Uown
    Então cores, logos e identidade Uown são exibidas
    E nenhum elemento de Kornerstone é exibido
    E vice-versa para domínios Kornerstone

  Cenário: Templates Kornerstone apontam para novas URLs
    Quando um evento de comunicação Kornerstone é disparado
    Então os templates de e-mail e SMS usam domínios apply/secure kornerstoneliving com shortCode
    E nenhum link usa o domínio antigo

  Cenário: shortCode inexistente
    Quando a API de continuidade é chamada com shortCode inexistente
    Então leadFound é falso e nenhuma exceção é lançada



---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in sandbox

---
### Scenario 1: Send Application flow with legacy URL
```markdown
- Given an existing application UUID and payment frequency
- When the URL "origination-{env}.uowleansing.com/sendApplication?uuid={uuid}&paymentFrequency={frequency}" is accessed
- Then the send flow loads successfully
- And the theme matches the accessed domain
- And the correct communication template is triggered
```

|    LeadPk  |
|------------|
| 94449      |

**PASS**

---
### Scenario 2: Send Application flow with new domain short URL
```markdown
- Given an existing application shortCode for the target domain
- When the URL "apply-{env}.<brand-domain>/{shortCode}/send" is accessed
- Then the send flow loads successfully
- And the theme matches the domain (Uown or Kornerstone)
- And the email/SMS templates use the new short URL
```

|    LeadPk  |
|------------|
| 94450      |

**PASS**

---
### Scenario 3: Finalize Application flow with legacy URL
```markdown
- Given an existing application UUID and payment frequency
- When the URL "origination-{env}.uowleansing.com/finalizeApplication?uuid={uuid}&paymentFrequency={frequency}" is accessed
- Then the application state is retrieved and displayed
- And the theme matches the domain
```


|    LeadPk  |
|------------|
| 94445      |

**PASS**

---
### Scenario 4: Finalize Application flow with new domain short URL
```markdown
- Given an existing application shortCode for the target domain
- When the URL "secure-{env}.<brand-domain>/{shortCode}/finalize" is accessed
- Then the application state is retrieved and displayed
- And the theme matches the domain
```


|    LeadPk  |
|------------|
| 94446      |

**PASS**

---
### Scenario 5: Complete Application flow with legacy URL
```markdown
- Given an existing application UUID and payment frequency
- When the URL "origination-{env}.uowleansing.com/completeApplication?uuid={uuid}&paymentFrequency={frequency}" is accessed
- Then the flow completes the application without errors
- And the final communications are sent with the correct template
```

---
### Scenario 6: Complete Application flow with new domain short URL
```markdown
- Given an existing application shortCode for the target domain
- When the URL "secure-{env}.<brand-domain>/{shortCode}/complete" is accessed
- Then the flow completes the application without errors
- And the final redirect/e-signature uses the correct URL
- And the theme matches the domain
```

---
### Scenario 7: Lead resolution via shortCode
```markdown
- Given an existing shortCode
- When the continuity API is called with the shortCode
- Then leadFound is true and leadPk is returned
```

---
### Scenario 8: Domain-isolated branding
```markdown
- Given the application is accessed via a Uown domain
- When the application UI is rendered
- Then Uown colors, logos, and identity are displayed
- And no Kornerstone elements are shown
- And vice versa for Kornerstone domains
```

---
### Scenario 9: Kornerstone templates point to new URLs
```markdown
- Given a Kornerstone communication event is triggered
- When email and SMS templates are generated
- Then the templates use apply/secure kornerstoneliving domains with shortCode
- And no link uses the legacy domain
```

---
### Scenario 10: Non-existent shortCode
```markdown
- Given a non-existent shortCode
- When the continuity API is called with the shortCode
- Then leadFound is false and no exception is thrown
```
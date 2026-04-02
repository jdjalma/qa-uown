---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1199


UOWN | Origination | Update Complete Application (CC/ACH) URLs With Expiration Control

Synopsis
Update the Complete Application (CC/ACH) flow URLs to use secure, branded domains and enforce a time-based expiration policy for customer access links.

Business Objective
The Complete Application flow is customer-facing and handles sensitive payment information.
Currently, the URLs used for this step are not aligned with a professional, secure, and industry-standard pattern, and they do not clearly enforce time-based access control.
By introducing branded secure domains and link expiration, the platform increases customer trust, improves security, and aligns with best practices for handling sensitive financial data.

Feature Request | Business Requirements
URL Format
When a customer is sent a Complete Application link, it must follow these formats:
UOWN
secure.uownleasing.com/{SHORT_CODE}
KORNERSTONE
secure.kornerstoneliving.com/{SHORT_CODE}
The {SHORT_CODE} must be a short, customer-friendly identifier mapped internally to the application.

Link Expiration Rules
The complete application link must be valid for a limited period, starting with:
    24 hours after generation.
Every time a new complete application link is generated:
      The expiration timer must be reset.
      Any previously generated links for the same application must become invalid.

teps-to-Reproduce
    Complete a application
    Obtain the URL that is sent
    Verify that the URL works
    Generate a new URL       
    Verify that the previous URL no longer works and that the new one does.


---------------------------------------------------------------------------------------------------------------------------------------------------------

---

# UOWN | Origination | Atualizar URLs de Complete Application (CC/ACH) com Controle de Expiração

## Sinopse
Atualizar as URLs do fluxo de Complete Application (CC/ACH) para usar domínios seguros e com marca, além de impor uma política de expiração por tempo para os links de acesso do cliente.

## Objetivo de Negócio
O fluxo de Complete Application é voltado ao cliente e lida com informações sensíveis de pagamento.
Hoje, as URLs usadas não seguem um padrão profissional, seguro e reconhecido, e não deixam claro o controle de expiração por tempo.
Ao introduzir domínios seguros com marca e expiração de links, a plataforma aumenta a confiança do cliente, melhora a segurança e se alinha às boas práticas para dados financeiros sensíveis.

## Requisitos da Funcionalidade (Business Requirements)

### Formato de URL
Quando um cliente recebe um link de Complete Application, ele deve seguir estes formatos:
- UOWN: `https://secure.uownleasing.com/{SHORT_CODE}`
- KORNERSTONE: `https://secure.kornerstoneliving.com/{SHORT_CODE}`
- O `{SHORT_CODE}` deve ser um identificador curto e amigável ao cliente, mapeado internamente para a aplicação.

### Regras de Expiração do Link
- O link de Complete Application deve ser válido por um período limitado, iniciando em **24 horas após a geração**.
- Sempre que um novo link de Complete Application for gerado:
  - O temporizador de expiração deve ser redefinido.
  - Qualquer link anterior gerado para a mesma aplicação deve se tornar inválido.

### Passos para Reproduzir (Steps-to-Reproduce)
1. Completar uma aplicação.
2. Obter a URL que é enviada.
3. Verificar que a URL funciona.
4. Gerar uma nova URL.
5. Verificar que a URL anterior não funciona mais e que a nova funciona.

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

src/main/java/com/uownleasing/common/pojo/LeadInfo.java




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




src/main/java/com/uownleasing/svc/service/CalculatorService.java
package com.uownleasing.svc.service;

import com.uownleasing.common.enumeration.Frequency;
import com.uownleasing.common.enumeration.LeadStatus;
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
import java.time.temporal.ChronoUnit;
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

    private final LeadProgramService leadProgramService;

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

        List<MerchantProgram> programs = leadProgramService.getLTOProgramsForLead(ctx.lead(), ctx.state(), ctx.merchant());
        log.info("[CalculatorService][getProgramsForLead] lead {}, Programs exist? {}", request.getLead().getPk(), !programs.isEmpty());
        if (programs.isEmpty()) {
            String termLog = StringUtils.isNotBlank(uwData.getUwInfo().getEligibleTerms()) ? " for %s month term(s) ".formatted(uwData.getUwInfo().getEligibleTerms()) : " for 13 Month term";
            String log = "No active merchant program for lead %d in state %s"
                + ctx.lead().getPk()
                + " in state "
                + ctx.state()+termLog;
            return new CalculatorResults(log);
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
            : (params.contractAmountBeforeTax().subtract(params.minLastPaymentAmount()))
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
        sched.setNextPaymentWithTax(regularPaymentNoTax.add(regularTax).setScale(2, RoundingMode.HALF_EVEN));
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
        BigDecimal epoAmountWithFees = sched.getCostWithFeesNoTax().add(epoFeeAmount).add(params.buyOutFee());

        if(configurationManagement.getString(configurationPath+"changeEpoForTermMonths", "16")
            .contains(String.valueOf(params.termMonths()))){
            BigDecimal leaseAmount = ((params.baseCost().multiply(sched.getMoneyFactor())).subtract(params.baseCost())).setScale(4, RoundingMode.HALF_EVEN);
            long leaseDays = calculateLeaseDays(firstPaymentDate, numOfPayments, frequency);
            BigDecimal dailyLeaseAmount = leaseAmount.divide(BigDecimal.valueOf(leaseDays), 2, RoundingMode.HALF_EVEN).setScale(2, RoundingMode.HALF_EVEN);
            epoAmountWithFees = params.baseCost()
                .add(dailyLeaseAmount.multiply(BigDecimal.valueOf(params.epoDays())))
                .add(sched.getProcessingFee())
                .add(epoFeeAmount)
                .add(params.buyOutFee()).setScale(2, RoundingMode.HALF_EVEN);
            String notes = ("[CalculatorService][buildScheduleForFrequency] 16 Month EPO (with fees) for cost %s, moneyFactor %s" +
                ", frequency %s, number of payments %s, processing fee %s  is %s").formatted(
                params.baseCost(), sched.getMoneyFactor(), frequency, numOfPayments, sched.getProcessingFee(), epoAmountWithFees );
            log.info(notes);
            params.ctx().lead().getLeadInfo().setNotes(notes);
        }
        sched.setEpoAmountWithoutTax(epoAmountWithFees);

        // --- Redirect URL ---
        sched.setRedirectUrl(params.redirectUrl() + frequency);

        return sched;
    }

    public static long calculateLeaseDays(
        LocalDate firstPaymentDate,
        int numberOfPayments,
        Frequency frequency) {
        if (numberOfPayments <= 1) {
            return 0;
        }

        switch (frequency) {
            case WEEKLY:
                return (long) (numberOfPayments - 1) * 7;

            case BI_WEEKLY:
                return (long) (numberOfPayments - 1) * 14;

            case SEMI_MONTHLY:
                return (long) (numberOfPayments - 1) * 15;

            case MONTHLY:
                LocalDate lastPaymentDate =
                    firstPaymentDate.plusMonths(numberOfPayments - 1);
                return ChronoUnit.DAYS.between(firstPaymentDate, lastPaymentDate);

            default:
                throw new IllegalArgumentException("Unsupported frequency: " + frequency);
        }
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
        Integer numberOfPayments = configurationManagementService.getInteger(basePath + numberOfMonths + "." + frequency);
        if (numberOfPayments == null) {
            if (frequency.equals(Frequency.MONTHLY))
                return numberOfMonths;
            throw new SvcException("Cannot determine the number of %s payments for %d months".formatted(frequency.name(), numberOfMonths));
        }
        return numberOfPayments;
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




src/main/resources/db/migration/V20260202081555__add_short_code_to_los_payment_options.sql
-- =====================================================
-- Flyway Migration: V20260202081555__add_short_code_to_los_payment_options.sql
-- Created: 2026-02-02 08:15:55 PST/PDT
-- Description: Add short_code column to multiple tables
-- =====================================================

ALTER TABLE "uown_los_payment_options"
ADD COLUMN IF NOT EXISTS short_code VARCHAR(8);

ALTER TABLE "uown_los_payment_options_history"
ADD COLUMN IF NOT EXISTS short_code VARCHAR(8);

ALTER TABLE "uown_sv_sched_summary"
ADD COLUMN IF NOT EXISTS short_code VARCHAR(8);

ALTER TABLE "uown_sv_sched_summary_history"
ADD COLUMN IF NOT EXISTS short_code VARCHAR(8);

ALTER TABLE "uown_los_sched_summary"
ADD COLUMN IF NOT EXISTS short_code VARCHAR(8);

ALTER TABLE "uown_los_sched_summary_history"
ADD COLUMN IF NOT EXISTS short_code VARCHAR(8);

-- =====================================================
-- Migration DOWN (commented) - For reference only
-- To undo these changes, create a new migration and apply:
-- =====================================================
-- ALTER TABLE "uown_los_payment_options" DROP COLUMN short_code;
-- ALTER TABLE "uown_los_payment_options_history" DROP COLUMN short_code;
-- ALTER TABLE "uown_sv_sched_summary" DROP COLUMN short_code;
-- ALTER TABLE "uown_sv_sched_summary_history" DROP COLUMN short_code;
-- ALTER TABLE "uown_los_sched_summary" DROP COLUMN short_code;
-- ALTER TABLE "uown_los_sched_summary_history" DROP COLUMN short_code;




src/main/java/com/uownleasing/common/pojo/SchedSummaryInfo.java

    @Transient
    private long paymentOptionsPk;

    private String shortCode;

    private BigDecimal totalContractAmountWithTaxAndFees = BigDecimal.ZERO;
    private BigDecimal costWithoutTaxAndFees = BigDecimal.ZERO;
    private BigDecimal costWithFeesNoTax = BigDecimal.ZERO;






---------------------------------------------------------------------------------------------------------------------------------------------------------

Cenarios de teste:


1) Geração de URL UOWN com domínio seguro
```gherkin
Cenário: Gera URL de complete application com domínio seguro UOWN
  Dado que existe um lead em UW_APPROVED ou CONTRACT_CREATED sem shortCode
  Quando um link de complete application é gerado
  Então a URL é "https://secure.uownleasing.com/{SHORT_CODE}"
  E {SHORT_CODE} é um valor base62 de 8 caracteres salvo no lead
```
94267
https://secure-sandbox.uownleasing.com/xpRKCzuo/complete?selectedPaymentFrequency=WEEKLY


---
2) Geração de URL KORNERSTONE com domínio seguro
```gherkin
Cenário: Gera URL de complete application com domínio seguro KORNERSTONE
  Dado que existe um lead em UW_APPROVED ou CONTRACT_CREATED sem shortCode
  Quando um link de complete application é gerado para cliente Kornerstone
  Então a URL é "https://secure.kornerstoneliving.com/{SHORT_CODE}"
  E {SHORT_CODE} é um valor base62 de 8 caracteres salvo no lead
```


---
3) Link funciona dentro de 36h
```gherkin
Cenário: Permite acesso dentro de 36 horas da criação do link
  Dado que o link foi gerado há menos de 36 horas
  Quando o cliente abre o link
  Então o link é aceito
```

---
4) Link expira após 36h
```gherkin
Cenário: Rejeita acesso após 36 horas da criação do link
  Dado que o link foi gerado há mais de 36 horas
  Quando o cliente abre o link
  Então o link é rejeitado com "Link is valid only for 36 hours. Please submit new application"
```

5) Novo link invalida anteriores
```gherkin
Cenário: Link anterior torna-se inválido após geração de novo link
  Dado que já existe um link emitido para um lead
  Quando um novo link de complete application é gerado para o mesmo lead
  Então o novo link é aceito
  E o link anterior é rejeitado como inválido
```

---
6) shortCode inválido é rejeitado
```gherkin
Cenário: Rejeita acesso quando o shortCode não é encontrado
  Dado que o shortCode não está associado a nenhum lead
  Quando o link é aberto
  Então a requisição é rejeitada com "Invalid link. Please contact merchant"
```

---
7) Status do lead não elegível bloqueia acesso
```gherkin
Cenário: Rejeita acesso quando o status do lead não é UW_APPROVED ou CONTRACT_CREATED
  Dado que o lead está em status FUNDING
  Quando o link é aberto
  Então a requisição é rejeitada com "Application is funding. Please reapply"
```
--> Comportamento alterado
A mensagem exibida é Invalid link. Please contact merchant.

---
8) shortCode ausente é gerado e salvo
```gherkin
Cenário: Gera e persiste shortCode quando ausente
  Dado que o lead não possui shortCode
  Quando um link de complete application é solicitado
  Então um shortCode base62 de 8 caracteres é criado e salvo no lead
  E a URL gerada usa esse shortCode
```

---
) Timer de expiração reinicia em novo link
```gherkin
Cenário: Timer de expiração reinicia ao emitir novo link
  Dado que existe um link gerado há N horas (N<24)
  Quando um novo link é gerado para o mesmo lead
  Então o novo prazo de validade começa na geração do novo link
  E o link antigo torna-se inválido imediatamente
```

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Comentario gitlab:

## Tests in sandbox

---
### Scenario 1: Generate secure complete application URL for UOWN
```markdown
- Given a lead in UW_APPROVED or CONTRACT_CREATED without a shortCode
- When a complete application link is generated
- Then the URL is "https://secure.uownleasing.com/{SHORT_CODE}"
- And {SHORT_CODE} is a base62 value with 8 characters saved on the lead

| LeadPk |
|--------|
| 94267  |
```

**PASS**

---
### Scenario 2: Generate secure complete application URL for KORNERSTONE
```markdown
- Given a lead in UW_APPROVED or CONTRACT_CREATED without a shortCode
- When a complete application link is generated for a Kornerstone customer
- Then the URL is "https://secure.kornerstoneliving.com/{SHORT_CODE}"
- And {SHORT_CODE} is a base62 value with 8 characters saved on the lead

| LeadPk |
|--------|
| 94451  |
```

**PASS**

---
### Scenario 3: Allow access within 36 hours of link creation 
```markdown
- Given the link was generated less than 36 hours ago
- When the customer opens the link
- Then the link is accepted

| LeadPk |
|--------|
| 94451  |
```

**PASS**

---
### Scenario 4: Reject access after 36 hours of link creation 
```markdown
- Given the link was generated more than 36 hours ago
- When the customer opens the link
- Then the link is rejected with "Link is valid only for 36 hours. Please submit new application"

| LeadPk |
|--------|
| 94451  |
```
![Screenshot_at_Feb_16_23-16-31](/uploads/1f2fcea5c8ffb11e2bc53d57a54f40f9/Screenshot_at_Feb_16_23-16-31.png){width=900 height=451}
![Screenshot_at_Feb_16_23-16-37](/uploads/1f1241ab204027c6b0199a5af1d6a1d7/Screenshot_at_Feb_16_23-16-37.png){width=900 height=46}
![Screenshot_at_Feb_16_23-17-57](/uploads/c30872517f977ee221b70ffb3d7ff55b/Screenshot_at_Feb_16_23-17-57.png){width=900 height=451}
![Screenshot_at_Feb_16_23-18-04](/uploads/a42553edb818f5584f986adf8000e6c2/Screenshot_at_Feb_16_23-18-04.png){width=900 height=55}

**PASS**

---
### Scenario 5: New link replaces and invalidates the previous one, resetting the timer
```markdown
- Given there is already a link issued for a lead
- And that link was generated N hours ago (N < 24)
- When a new complete application link is generated for the same lead
- Then the new link is accepted
- And the previous link is rejected as invalid
- And the validity period starts counting from the creation of the new link

| LeadPk |
|--------|
| 94451  |
```

**PASS**

---
### Scenario 6: Reject access when shortCode is not found
```markdown
- Given the shortCode is not associated with any lead
- When the link is opened
- Then the request is rejected with "Invalid link. Please contact merchant"

| LeadPk |
|--------|
| 94451  |
```

**PASS**

---
### Scenario 7: Reject access when lead status is not UW_APPROVED or CONTRACT_CREATED
```markdown
- Given the lead is in status FUNDING
- When the link is opened
- Then the request is rejected with "Invalid link. Please contact merchant"

| LeadPk |
|--------|
| 94451  |
```

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

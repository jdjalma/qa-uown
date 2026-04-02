-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1168


UOWN | Origination | Update CC Convenience Fee Displayed Value to $2 Across All UOWN Channels


Synopsis
The current Credit Card Convenience Fee displayed in the system is $1.
This value must be updated to $2 everywhere it is shown to customers or internal users.
This includes, but is not limited to:
    CC/ACH pages
    Emails  
    SMS
    Any material or interface where UOWN shows this fee
The update must ensure absolute consistency across all modules and communication channels.


Business Objective
Updating this fee across all display points ensures pricing accuracy, avoids customer confusion, and keeps all communication channels aligned with current business rules.
This consistency is critical for transparency, regulatory alignment, and customer trust.


Feature Request | Business Requirements
Update the displayed CC Convenience Fee from $1 to $2 everywhere it appears in the system, including CC/ACH pages, emails, SMS, and any other locations where UOWN presents this fee.


Test instructions
The convenience fee value is customizable.
The fee appears in the messaging for the recurring correspondence email and as footnote in the payment page in the customer portal.
The value for QA1 is 4


-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

---

# **UOWN | Origination | Atualizar Valor da CC Convenience Fee para $2 em Todos os Canais da UOWN**

## **📌 Sinopse**

Atualmente, a taxa de conveniência para pagamentos com cartão de crédito (Credit Card Convenience Fee) exibida no sistema é **$1**.
Esse valor deve ser atualizado para **$2** em **todos os locais** onde é exibido para clientes ou usuários internos, incluindo (mas não limitado a):

* Telas de **CC/ACH**
* **E-mails**
* **SMS**
* Qualquer material, portal ou interface onde a UOWN apresente essa taxa

A atualização deve garantir **consistência absoluta** em todos os módulos e canais de comunicação.

---

## **🎯 Objetivo de Negócio**

Ajustar essa taxa em todos os pontos de exibição garante:

* **Conformidade** com o valor atualizado
* **Precisão** da informação repassada ao cliente
* **Transparência e confiança**
* **Alinhamento** entre regras de negócio e comunicação

Manter um valor antigo ou inconsistente pode causar dúvidas, reclamações ou confusão.

---

## **📌 Requisito da Funcionalidade**

Atualizar o valor exibido da CC Convenience Fee de **$1 para $2** em todos os locais do sistema, incluindo:

* Telas de CC/ACH
* E-mails enviados automaticamente
* SMS
* Portais internos e externos
* Qualquer outro ponto onde a taxa seja apresentada ao usuário

> Observação: o comportamento funcional da taxa continua sendo baseado no valor configurado via backend.

---

## **🧪 Instruções de Teste**

* A CC Convenience Fee é **customizável** no sistema.
* Essa taxa aparece:

  * nas mensagens enviadas por e-mail na correspondência recorrente
  * como *footnote* na página de pagamento no **Customer Portal**

### **Valor atual em QA1 para teste:**

👉 **$4** (para fins de validação)

### **O que validar:**

* Verificar se todos os pontos que exibiam "$1" agora exibem **"$2"** (ou o valor configurado no ambiente, como $4 em QA1).
* Validar consistência visual e textual em:

  * Telas de CC/ACH no Origination
  * Customer Portal
  * E-mails enviados automaticamente
  * SMS gerados pelo sistema
  * Qualquer outra interface da UOWN que mencione a taxa
* Confirmar que **nenhuma referência ao valor antigo ($1)** permanece no sistema.

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Todas os tópico foram resolvidos!
Comparar
e
 8 arquivos
+
39
−
11
Arquivos
8
Pesquisar (por exemplo, *.vue) (F)

src/
‎main‎

java/com/uow
‎nleasing/svc‎

con
‎fig‎

CreditCard
‎Config.java‎
+16 -0

po
‎jo‎

CommonDat
‎aPojo.java‎
+2 -0

Correspondenc
‎eRequest.java‎
+2 -1

rest
‎/svc‎

SvcCreditCardC
‎ontroller.java‎
+8 -0

ser
‎vice‎

Correspondenc
‎eService.java‎
+0 -1

ScheduledTas
‎kService.java‎
+7 -5

SvAccountS
‎ervice.java‎
+1 -1

resources/corresp
‎ondence/templates‎

recurring-payment-
‎reminder-email.html‎
+3 -3

 src/main/java/com/uownleasing/svc/config/CreditCardConfig.java  0 → 100644
+
16
−
0

Visualizado
package com.uownleasing.svc.config;

import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CreditCardConfig {
    private static final String CONFIGURATION_PATH = "com.uownleasing.svc.config.CreditCardConfig.";
    private final ConfigurationManagement configurationManagement;

    public String getConvenienceFee() {
        return configurationManagement.getString(CONFIGURATION_PATH + "convenienceFee", "1");
    }
}
 src/main/java/com/uownleasing/svc/pojo/CommonDataPojo.java 
+
2
−
0

Visualizado
@@ -118,6 +118,8 @@ public class CommonDataPojo {
    private String vendorPrivacyPolicyLink = "https://uownleasing.com/privacy-policy/";
    private String vendorTermsLink = "https://uownleasing.com/terms-of-service/";

    private String convenienceFee;

    public CommonDataPojo() {}

    /**
 src/main/java/com/uownleasing/svc/pojo/CorrespondenceRequest.java 
+
2
−
1

Visualizado
@@ -5,6 +5,7 @@ import lombok.*;

import javax.persistence.*;
import java.time.*;
import java.util.Map;

@Getter
@Setter
@@ -29,7 +30,7 @@ public class CorrespondenceRequest {

    private Long templateVersion;

    CommonDataPojo commonDataPojo = new CommonDataPojo();
    private CommonDataPojo commonDataPojo = new CommonDataPojo();

    private LocalDateTime sendByTime = LocalDateTime.now();

 src/main/java/com/uownleasing/svc/rest/svc/SvcCreditCardController.java 
+
8
−
0

Visualizado
@@ -4,6 +4,7 @@ import com.uownleasing.common.enumeration.*;
import com.uownleasing.common.pojo.*;
import com.uownleasing.svc.common.db.entity.*;
import com.uownleasing.svc.common.service.*;
import com.uownleasing.svc.config.CreditCardConfig;
import com.uownleasing.svc.pojo.PaymentArrangement;
import com.uownleasing.svc.service.*;
import com.uownleasing.svc.service.cc.CCPGService;
@@ -36,6 +37,8 @@ public class SvcCreditCardController {

    private final CCRunRefundService ccRunRefundService;

    private final CreditCardConfig creditCardConfig;

    @GetMapping("/getCreditCards/{accountPk}")
    public List<SvCreditCard> getCreditCards(@PathVariable long accountPk){
        return ccService.getTokenizedCardsByAccountPk(accountPk);
@@ -115,4 +118,9 @@ public class SvcCreditCardController {
    public String paymentGatewayFixByCcTransactionPks(@RequestBody List<Long> cctPk) {
        return ccpgService.paymentGatewayFixByCcTransactionPks(cctPk);
    }

    @GetMapping("/getCCConvenienceFee")
    public String getCCConvenienceFee() {
        return creditCardConfig.getConvenienceFee();
    }
}
 src/main/java/com/uownleasing/svc/service/CorrespondenceService.java 
+
0
−
1

Visualizado
@@ -119,7 +119,6 @@ public class CorrespondenceService {

            if(MapUtils.isNotEmpty(dataMap)) {
                String templateContent = template.getTemplateInfo().getTemplateContent();

                if (correspondenceRequest.getCorrespondenceType() == CorrespondenceType.EMAIL) {
                    log.debug("Creating Email Queue request for Template {}, for Lead {}, for Account {}", correspondenceRequest.getTemplateName(), correspondenceRequest.getLeadPk(), correspondenceRequest.getAccountPk());
                    String mergedTemplate =  thymeleafTemplateEngine.mergeDataIntoTemplateString(templateContent, dataMap, TemplateMode.HTML);
                     src/main/java/com/uownleasing/svc/service/ScheduledTaskService.java 
+
7
−
5

Visualizado
@@ -22,6 +22,7 @@ import com.uownleasing.svc.common.db.entity.*;
import com.uownleasing.svc.common.db.repository.SvAccountRepo;
import com.uownleasing.svc.common.db.repository.SvCreditCardRepo;
import com.uownleasing.svc.common.service.*;
import com.uownleasing.svc.config.CreditCardConfig;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.BankVerification;
@@ -168,6 +169,8 @@ public class ScheduledTaskService {

    private final SigningFeeService signingFeeService;

    private final CreditCardConfig creditCardConfig;

    private final String configurationPath = "com.uownleasing.svc.service.ScheduledTaskService.";
    private static final String ENVIRONMENT_NAME = System.getenv("ENVIRONMENT_NAME");

@@ -658,10 +661,10 @@ public class ScheduledTaskService {
        runSweep("RecurringPaymentReminderSweep", BigInteger.class,
            (task, baseConfig, l, error) -> {
                for (BigInteger accountPk : l) {
                    if (getTaskInterrupted(baseConfig))
                        break;
                    if (getTaskInterrupted(baseConfig)) break;

                    CorrespondenceRequest request = new CorrespondenceRequest();
                    request.getCommonDataPojo().setConvenienceFee(creditCardConfig.getConvenienceFee());
                    request.setAccountPk(accountPk.longValue());
                    try {
                        request.setTemplateName("RecurringPaymentReminder");
@@ -672,13 +675,12 @@ public class ScheduledTaskService {
                        log.error("Exception in send recurring payment reminders email sweep ", e);
                    }
                    try {
                        if(configurationManagement.getBoolean(configurationPath+"send.recurring.payment.reminder.sms",true)) {
                        if (configurationManagement.getBoolean(configurationPath + "send.recurring.payment.reminder.sms", true)) {
                            request.setTemplateName("RecurringPaymentReminderSms");
                            request.setCorrespondenceType(CorrespondenceType.SMS);
                            correspondenceService.createCorrespondence(request);
                        }
                    }
                    catch(Exception e) {
                    } catch (Exception e) {
                        scheduledTaskHelper.setError(accountPk.longValue(), null, error, e.getMessage());
                        log.error("Exception in send recurring payment reminders sms sweep ", e);
                    }
 src/main/java/com/uownleasing/svc/service/SvAccountService.java 
+
1
−
1

Visualizado
@@ -18,6 +18,7 @@ import com.uownleasing.svc.common.db.repository.SvACHPaymentRepo;
import com.uownleasing.svc.common.db.repository.SvAccountRepo;
import com.uownleasing.svc.common.db.repository.SvPaymentRepo;
import com.uownleasing.svc.common.service.*;
import com.uownleasing.svc.config.CreditCardConfig;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.*;
@@ -842,5 +843,4 @@ public class SvAccountService extends AccountService {
            .map(r -> r.name() + " - " + r.getRatingLetterDescription())
            .collect(Collectors.toList());
    }

}
 src/main/resources/correspondence/templates/recurring-payment-reminder-email.html 
+
3
−
3

Visualizado
@@ -80,7 +80,7 @@
        color: #5ECBF5;
        margin: 20px 0;
      ">
    <div style="margin: 35px auto;width: 420;"><i>Don’t forget! <br>Uown offers great early payoff options.</div>
    <div style="margin: 35px auto;width: 420;"><i>Don’t forget! <br>Uown offers great early payoff options.</i></div>
  </div>
  <div style="
        overflow: visible;
@@ -94,10 +94,10 @@
        margin: 20px 0;
      ">
    <div style="margin: 35px auto; width: 420px;">
      * $1 Convenience Fee charged by processor on all Debit or Credit Card Payments. ACH payments are not subject to the fee.
      * <span th:text="'$' + ${CommonDataPojo.convenienceFee}"></span> Convenience Fee charged by processor on all Debit or Credit Card Payments. ACH payments are not subject to the fee.
      If you would like to switch your payment method to ACH, please log into the customer portal at&nbsp;
      <a href="https://portal.uownleasing.com" target="_blank" rel="noopener noreferrer">
      portal.uownleasing.com
        portal.uownleasing.com
      </a>.
    </div>
  </div>

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/devops/configuration/-/blob/uown-sandbox/config/svc/application.yaml?ref_type=heads


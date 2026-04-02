---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/475



UOWN | Servicing | Create Lease Mod Alert in Servicing (Similar to Origination)



Synopsis
Currently, lease mod alerts are only available in the Origination. To ensure consistency and improve operational awareness, the same alert functionality must be added to the Servicing.



Feature Request | Business Requirements
    Implement a lease modification alert in Servicing, modeled after the existing functionality in Origination.
    Ensure the alert displays all relevant details.
    Match the design and behavior of Origination alerts for consistency.
    When a lease mod happens, we should create a new alert in SvAlert also just like we do with LosAlert



Test instructions
Created a lease, move it to funded. After modifying the funded lease a alert similar to the one that appears on origination should exist on servicing.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Criar Alerta de Modificação de Leasing no Servicing (Semelhante ao Origination)


Sinopse
Atualmente, os alertas de modificação de leasing estão disponíveis apenas no Origination.
Para garantir consistência e melhorar a visibilidade operacional, a mesma funcionalidade de alerta deve ser adicionada ao Servicing.


Requisitos da Funcionalidade / Requisitos de Negócio
Implementar um alerta de modificação de leasing no Servicing, modelado com base na funcionalidade já existente no Origination.
Garantir que o alerta exiba todas as informações relevantes sobre a modificação.
Manter o mesmo design e comportamento dos alertas do Origination, assegurando consistência visual e funcional.
Quando ocorrer uma modificação de leasing, deve ser criado um novo alerta em SvAlert, da mesma forma como atualmente é feito com o LosAlert.


Instruções de Teste
Crie um leasing e mova-o para o status Funded.
Após modificar o leasing financiado, verifique que:
Um alerta semelhante ao exibido no Origination foi criado no Servicing.
O alerta contém as informações corretas e segue o mesmo padrão visual e funcional existente no Origination.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 1 arquivo
+
11
−
4
 src/main/java/com/uownleasing/svc/service/LeadFundingService.java 
+
11
−
4

Visualizado
@@ -14,6 +14,7 @@ import com.uownleasing.los.common.service.LosItemService;
import com.uownleasing.los.common.service.LosLeadService;
import com.uownleasing.los.common.service.LosLoggingService;
import com.uownleasing.svc.common.db.entity.SvSqlConfig;
import com.uownleasing.svc.common.service.SvAlertService;
import com.uownleasing.svc.common.service.SvSqlConfigService;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
@@ -56,7 +57,9 @@ public class LeadFundingService {

    private final LosLoggingService losLoggingService;

    private final LosAlertService alertService;
    private final LosAlertService losAlertService;

    private final SvAlertService svAlertService;

    private final FundingTransactionService fundingTransactionService;

@@ -408,14 +411,18 @@ public class LeadFundingService {
            AlertInfo alertInfo = new AlertInfo();
            alertInfo.setLeadPk(losLead.getPk());
            alertInfo.setAlertMessage("Invoice details are updated after lease in Funding/Funded status");
            alertService.createOrUpdate(alertInfo);
            losAlertService.createOrUpdate(alertInfo);
            if (losLead.getLeadInfo().getAccountPk() != null) {
                alertInfo.setAccountPk(losLead.getLeadInfo().getAccountPk());
                svAlertService.createOrUpdate(alertInfo);
            }
            losLead.getLeadInfo().setNotes("[LeadService][updateFundingTransaction] Lead in FUNDING/ FUNDED. CancelOrRefund funding transaction");
            refundOrCancelFundingTransaction(losLead, invoiceType, amount);
        } else if (invoiceType == InvoiceType.PURCHASED && amount.compareTo(BigDecimal.ZERO) > 0) {
            AlertInfo alertInfo = new AlertInfo();
            alertInfo.setLeadPk(losLead.getPk());
            alertInfo.setAlertMessage("Purchased item(s) removed from invoice. Refunding purchased amount $" + amount);
            alertService.createOrUpdate(alertInfo);
            losAlertService.createOrUpdate(alertInfo);
            losLead.getLeadInfo().setNotes("[LeadService][updateFundingTransaction] Refunding purchased item amount $" + amount);
            refundOrCancelFundingTransaction(losLead, invoiceType, amount, items);
        }
@@ -529,7 +536,7 @@ public class LeadFundingService {
                alert.setLeadPk(leadPk);
                alert.setAccountPk(accountPk);
                alert.setAlertMessage(String.format("Reference number %s manually moved to Servicing; account %s. %s", leadPk, accountPk, comment != null ? "Comment: " + comment : ""));
                alertService.createOrUpdate(alert);
                losAlertService.createOrUpdate(alert);
            }
            return accountPk;
        }else{

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Ao modificar um leasing financiado com conta associada, o usuário deve visualizar um novo alerta criado no Servicing
When modifying a funded lease with an associated account, the user must see a new alert created in Servicing

Ao visualizar o alerta de modificação de fatura , o usuário deve ver a mensagem "Invoice details are updated after lease in Funding/Funded status"
When viewing the invoice modification alert, the user must see the message "Invoice details are updated after lease in Funding/Funded status"

Ao visualizar um alerta de modificação de leasing no Servicing, o usuário deve ver as mesmas informações e padrão visual do alerta correspondente no Origination
When viewing a lease modification alert in Servicing, the user must see the same information and visual pattern as the corresponding alert in Origination


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2


> ```gherkin

> **When modifying a funded lease with an associated account, the user must see a new alert created in Servicing**

> ![image]

> **| PASS |**
> ```

---

> ```gherkin

> **When viewing a lease modification alert in Servicing, the user must see the same information and visual pattern as the corresponding alert in Origination**

> ![image]

> **| PASS |**
> ```



---


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Obs: Quando faz um reembolso reabrindo a conta nao gera um alerta

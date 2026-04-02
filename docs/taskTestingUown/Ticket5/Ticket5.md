--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/payment-gateway/-/issues/5


---

### **UOWN | Payment Gateway | OMNIFUND declined payments display success message**

**Status:** Open
**Ticket created:** 21 hours ago
**Created by:** Yuri Araujo

### **Bug Description**

When a payment is processed using the **OMNIFUND** vendor, the Frontend displays a **success message even when the payment is declined**.

The issue was identified as occurring because the **SVC is overwriting the error message returned by OMNIFUND during the `runSale` flow**.

The root cause is that, in the payment gateway method **`setCcCaptureReply`**, the **error message attribute is not being populated**, causing the Frontend to interpret the response as a successful transaction.

### **Expected Result**

* When a payment is declined, the Frontend must display the **correct error message returned by OMNIFUND**.
* The error message **must not be overwritten by the SVC**.
* Declined payments must never be interpreted or displayed as successful.

### **Testing Steps**

1. Choose an account.
2. In the account’s credit card payment configuration, change the `cc_vendor` to **OMNIFUND**.
3. Attempt to make a payment (expected to fail).
4. Confirm that:

   * An **error message** is displayed on the Frontend.
   * No **success message** is shown for the declined payment.

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

### **UOWN | Payment Gateway | Pagamentos recusados pela OMNIFUND exibem mensagem de sucesso**

**Status:** Aberto
**Tíquete criado:** 21 horas atrás
**Criado por:** Yuri Araujo

### **Descrição do Bug**

Quando um pagamento é processado utilizando o fornecedor **OMNIFUND**, o Frontend exibe uma **mensagem de sucesso mesmo quando o pagamento é recusado**.

Foi identificado que o problema ocorre porque o **SVC está sobrescrevendo a mensagem de erro retornada pela OMNIFUND durante o fluxo `runSale`**.

A causa raiz é que, no método do gateway de pagamento **`setCcCaptureReply`**, o **atributo de mensagem de erro não está sendo preenchido**, fazendo com que o Frontend interprete a resposta como uma transação bem-sucedida.

### **Resultado Esperado**

* Quando um pagamento for recusado, o Frontend deve exibir a **mensagem de erro correta retornada pela OMNIFUND**.
* A mensagem de erro **não deve ser sobrescrita pelo SVC**.
* Pagamentos recusados **nunca devem ser interpretados ou exibidos como bem-sucedidos**.

### **Passos para Teste**

1. Escolher uma conta.
2. Na configuração de pagamento com cartão de crédito da conta, alterar o `cc_vendor` para **OMNIFUND**.
3. Realizar uma tentativa de pagamento (esperado que falhe).
4. Validar que:

   * Uma **mensagem de erro** é exibida no Frontend.
   * Nenhuma **mensagem de sucesso** é exibida para o pagamento recusado.

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

 2 arquivos
+
12
−
1
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

src/main/java/com/uown
‎leasing/payment/gateway‎

conve
‎rters‎

OmnifundCon
‎verter.java‎
+11 -1

resp
‎onse‎

OmnifundResp
‎onseData.java‎
+1 -0

 src/main/java/com/uownleasing/payment/gateway/converters/OmnifundConverter.java 
+
11
−
1

Visualizado
@@ -300,6 +300,7 @@ public class OmnifundConverter {
        data.setPaymentTokenId(xmlParser.getExpressionValue("//ResponseData/payment_token_id"));
        data.setCardNetwork(xmlParser.getExpressionValue("//ResponseData/card/network"));
        data.setCardNumber(xmlParser.getExpressionValue("//ResponseData/card/number"));
        data.setPhardCode(xmlParser.getExpressionValue("//ResponseData/phard_code"));

        // Format date-time once for reuse
        data.setAuthorizedDateTime(formatDateTime(data.getTranDate(), data.getTranTime()));
@@ -318,7 +319,11 @@ public class OmnifundConverter {
        }

        if (decision != DecisionEnum.ACCEPT_100 && StringUtils.isNotBlank(data.getDescription())) {
            replyMessage.setErrorMessage(data.getDescription());
            String errorMessage = data.getDescription();
            if (StringUtils.isNotBlank(data.getPhardCode())) {
                errorMessage = errorMessage + " (phard_code: " + data.getPhardCode() + ")";
            }
            replyMessage.setErrorMessage(errorMessage);
        }

        if (StringUtils.isNotBlank(data.getTranAmount())) {
@@ -347,6 +352,11 @@ public class OmnifundConverter {
        ccCaptureReply.setReconciliationID(data.getOrderNumber());
        ccCaptureReply.setRequestDateTime(data.getAuthorizedDateTime());

        if (StringUtils.isNotBlank(replyMessage.getErrorMessage())
            && !"ACCEPT".equalsIgnoreCase(replyMessage.getDecision())) {
            ccCaptureReply.setErrorMessage(replyMessage.getErrorMessage());
        }

        replyMessage.setCcCaptureReply(ccCaptureReply);
    }

 src/main/java/com/uownleasing/payment/gateway/response/OmnifundResponseData.java 
+
1
−
0

Visualizado
@@ -21,5 +21,6 @@ public class OmnifundResponseData {
    private String paymentTokenId;
    private String cardNetwork;
    private String cardNumber;
    private String phardCode;
}

--------------------------------------------------------------------------------------------------------------------------------------------------------

Funcionalidade: Exibição de mensagens de pagamento

  Cenário: Pagamento OMNIFUND recusado exibe mensagem de erro
    Dado que um pagamento com cartão é processado pela OMNIFUND
    E a transação é recusada com uma mensagem de erro
    Quando o Frontend recebe a resposta do pagamento
    Então o Frontend exibe a mensagem de erro
    E o Frontend não exibe mensagem de sucesso

  Cenário: Pagamento com cartão de vendor diferente de OMNIFUND recusado exibe mensagem de erro
    Dado que um pagamento com cartão é processado por um vendor diferente de OMNIFUND
    E a transação é recusada com uma mensagem de erro
    Quando o Frontend recebe a resposta do pagamento
    Então o Frontend exibe a mensagem de erro
    E o Frontend não exibe mensagem de sucesso

  Cenário: Pagamento com cartão de vendor diferente de OMNIFUND aprovado exibe mensagem de sucesso
    Dado que um pagamento com cartão é processado por um vendor diferente de OMNIFUND
    E a transação é aprovada
    Quando o Frontend recebe a resposta do pagamento
    Então o Frontend exibe a mensagem de sucesso
    E o Frontend não exibe mensagem de erro

--------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2

```gherkin
Feature: Payment message display

  Scenario: Declined OMNIFUND payment displays error message
    Given a credit card payment is processed by OMNIFUND
    And the transaction is declined with an error message
    When the Frontend receives the payment response
    Then the Frontend displays the error message
    And the Frontend does not display a success message

**| PASS |**

---

  Scenario: Declined non-OMNIFUND card payment displays error message
    Given a credit card payment is processed by a vendor other than OMNIFUND
    And the transaction is declined with an error message
    When the Frontend receives the payment response
    Then the Frontend displays the error message
    And the Frontend does not display a success message

**| PASS |**

---

  Scenario: Approved non-OMNIFUND card payment displays success message
    Given a credit card payment is processed by a vendor other than OMNIFUND
    And the transaction is approved
    When the Frontend receives the payment response
    Then the Frontend displays the success message
    And the Frontend does not display an error message

**| PASS |**

---

```

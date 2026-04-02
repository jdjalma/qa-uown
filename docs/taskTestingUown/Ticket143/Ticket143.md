---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/143

UOWN | Customer Portal | Zendesk tickets/emails not being received in Production

BUG:
The support team reported that since January 8, 2026, no emails/tickets have been received in Zendesk coming from the Customer Portal for Kornerstone accounts.
After analysis and testing in Staging, the email is sent and received correctly. However, in Production, it does not work: even though the setup appears to be pointing correctly, Kornerstone emails are not being received in Production.

FIX:
Investigate why Kornerstone Customer Portal emails/tickets have not been received by Zendesk in Production since January 8, 2026, identify root cause, and restore functionality. 


Testing Steps
Overview
Test improved exception handling in /submitSupportTicket endpoint. The endpoint now returns appropriate HTTP status codes (400 for client errors, 500 for server errors) and logs unexpected errors.
Test Cases
1. Successful Submission

Steps:
Submit valid support ticket request with all required fields
Verify response status code and body

Expected:
HTTP Status: 200 OK
Response body: {"success": true, "message": "Support ticket submitted successfully"}
Email sent successfully
Activity log created
Log Verification
Application Logs

Verify error logging for unexpected exceptions:
[CustomerPortalController][submitSupportTicket] Unexpected error
Full stack trace should be logged
No sensitive information exposed in logs
Database Verification

For successful submissions:
EmailQueue record created
SvActivityLog entry created

For failed submissions:
No EmailQueue record created (if failure occurs before email queue creation)
Error details logged in application logs

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

## UOWN | Portal do Cliente | Tickets/e-mails do Zendesk não estão sendo recebidos em Produção

### **BUG**

A equipe de suporte reportou que, desde **8 de janeiro de 2026**, nenhum e-mail/ticket proveniente do **Portal do Cliente** está sendo recebido no **Zendesk** para contas **Kornerstone**.

Após análise e testes no ambiente de **Staging**, foi confirmado que o envio e o recebimento de e-mails funcionam corretamente. Entretanto, em **Produção**, o fluxo não funciona: apesar de a configuração aparentar estar correta, os e-mails da Kornerstone não estão sendo recebidos no Zendesk em Produção.

---

### **FIX**

Investigar por que os e-mails/tickets do Portal do Cliente da Kornerstone não estão sendo recebidos pelo Zendesk em Produção desde **8 de janeiro de 2026**, identificar a **causa raiz** e **restaurar a funcionalidade**.

---

## **Etapas de Teste**

### **Visão Geral**

Testar a melhoria no tratamento de exceções do endpoint **/submitSupportTicket**.
O endpoint agora retorna códigos HTTP apropriados:

* **400** para erros do cliente
* **500** para erros do servidor

Além disso, erros inesperados passam a ser devidamente logados.

---

### **Casos de Teste**

#### **1. Submissão Bem-Sucedida**

**Passos:**

* Enviar uma requisição válida de ticket de suporte com todos os campos obrigatórios
* Verificar o código de status da resposta e o corpo retornado

**Resultado Esperado:**

* **HTTP Status:** 200 OK
* **Corpo da resposta:**

  ```json
  {"success": true, "message": "Support ticket submitted successfully"}
  ```
* E-mail enviado com sucesso
* Registro de atividade criado

---

## **Verificação de Logs**

### **Logs da Aplicação**

Verificar o registro de erros para exceções inesperadas:

* Log esperado:
  `[CustomerPortalController][submitSupportTicket] Unexpected error`
* O stack trace completo deve ser registrado
* Nenhuma informação sensível deve ser exposta nos logs

---

## **Verificação no Banco de Dados**

### **Para submissões bem-sucedidas:**

* Registro criado na tabela **EmailQueue**
* Entrada criada em **SvActivityLog**

### **Para submissões com falha:**

* Nenhum registro deve ser criado em **EmailQueue** (caso a falha ocorra antes da criação da fila de e-mails)
* Detalhes do erro devem estar registrados nos logs da aplicação

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 5 arquivos
+
284
−
22
Arquivos
5
Pesquisar (por exemplo, *.vue) (F)

src/
‎main‎

java/com/uow
‎nleasing/svc‎

pojo
‎/rest‎

SupportTicke
‎tRequest.java‎
+35 -0

re
‎st‎

CustomerPortal
‎Controller.java‎
+24 -2

ser
‎vice‎

SupportTicke
‎tService.java‎
+204 -0

SvCustomerS
‎ervice.java‎
+0 -20

resources/corresp
‎ondence/templates‎

support-tick
‎et-email.html‎
+21 -0

 src/main/java/com/uownleasing/svc/pojo/rest/SupportTicketRequest.java  0 → 100644
+
35
−
0

Visualizado
package com.uownleasing.svc.pojo.rest;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Getter
@Setter
@ToString
public class SupportTicketRequest {
    @NotNull(message = "Account PK is required")
    private Long accountPk;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Primary email is required")
    private String primaryEmail;

    private String primaryPhoneNumber;

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotBlank(message = "Message is required")
    private String message;

    @NotBlank(message = "Category is required")
    private String category;

    private String subject;
}
 src/main/java/com/uownleasing/svc/rest/CustomerPortalController.java 
+
24
−
2

Visualizado
package com.uownleasing.svc.rest;

import com.uownleasing.common.enumeration.Company;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.*;
import com.uownleasing.svc.pojo.rest.*;
import com.uownleasing.svc.service.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.*;
import java.util.*;

@RestController()
@RequiredArgsConstructor
@Slf4j
@RequestMapping(value = "/uown/svc", produces = MediaType.APPLICATION_JSON_VALUE)
public class CustomerPortalController {

@@ -22,6 +26,8 @@ public class CustomerPortalController {

    private final CorrespondenceTrackingService correspondenceTrackingService;

    private final SupportTicketService supportTicketService;

    @PostMapping(value="/authenticateCustomer")
    public CustomerLoginResult authenticateCustomer(@RequestBody @NonNull CustomerLoginRequest customerLoginRequest){
        return customerService.authenticateCustomer(customerLoginRequest);
@@ -52,8 +58,24 @@ public class CustomerPortalController {
    }

    @GetMapping("/getZendeskEmailCategories")
    public List<SvCustomerService.CategoryDTO> getZendeskEmailCategories() {
        return customerService.getZendeskEmailCategories();
    public List<SupportTicketService.CategoryDTO> getZendeskEmailCategories() {
        return supportTicketService.getZendeskEmailCategories();
    }

    @PostMapping("/submitSupportTicket")
    public ResponseEntity<Map<String, Object>> submitSupportTicket(
            @RequestBody @Valid SupportTicketRequest request) {
        try {
            supportTicketService.submitSupportTicket(request);
            return ResponseEntity.ok(Map.of("success", true, "message", "Support ticket submitted successfully"));
        } catch (SvcException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("[CustomerPortalController][submitSupportTicket] Unexpected error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "An unexpected error occurred. Please try again later."));
        }
    }

}


 4 arquivos
+
61
−
114
Arquivos
4
Pesquisar (por exemplo, *.vue) (F)

a
‎pi‎

emai
‎l.tsx‎
+23 -6

components/korne
‎rstone/contactUs‎

inde
‎x.tsx‎
+0 -6

pages/
‎contact‎

inde
‎x.tsx‎
+25 -16

serv
‎er.js‎
+13 -86

 api/email.tsx 
+
23
−
6

Visualizado
export default class Email {
  constructor() {}

  static send(data: any) {
  static send(data: any, userToken?: string | null) {
    // eslint-disable-next-line no-undef
    const headers: HeadersInit = {
      'Content-Type': 'application/json;charset=utf-8',
    };

    if (userToken) {
      headers['usertoken'] = userToken;
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(data),
      headers,
      body: JSON.stringify({
        accountPk: data.accountNumber ? parseInt(data.accountNumber, 10) : null,
        customerName: data.customerName,
        primaryEmail: data.primaryEmail,
        primaryPhoneNumber: data.primaryPhoneNumber,
        accountNumber: data.accountNumber,
        message: data.message,
        category: data.category,
        to: data.to,
        subject: data.subject,
      }),
    };
    return fetch('/api/emails/send', options);
    return fetch('/uown/svc/submitSupportTicket', options);
  }
}
 components/kornerstone/contactUs/index.tsx 
+
0
−
6

Visualizado
@@ -49,12 +49,6 @@ export const KornerstoneContactUs = ({
              <Button className="px-0 mx-1" buttonStyle="secondary" noBorder>
                <a href={`tel:+1-${telLink}`}>{contactPhoneNumber}</a>
              </Button>
              Email:
              <Button className="px-0 mx-1" buttonStyle="secondary" noBorder>
                <a href="mailto:cs@kornerstoneliving.com">
                  cs@kornerstoneliving.com
                </a>
              </Button>
            </div>
          </Col>
        </Row>
 pages/contact/index.tsx 
+
25
−
16

Visualizado
@@ -81,22 +81,31 @@ const Contact = (props: ContactProps) => {
      const data: any = Object.assign({}, values);
      data.subject = `[${company}] - ${selectedCategory.label} - ${values.accountNumber} - ${values.customerName}`;
      data.to = selectedCategory.to;
      // eslint-disable-next-line no-console
      console.log('[Email Frontend] Sending email to:', data.to);
      EMAIl.send(data).then((res) => {
        res
          .json()
          .then(() => {
            showToast('success', 'Successfully submitted your support ticket.');
            resetForm();
          })
          .catch(() => {
            showToast(
              'error',
              'Unable to submit your support ticket. Please try again or call uown directly for support.',
            );
          });
      });

      const userToken = accountStore?.userToken;
      const errorMessage =
        'Unable to submit your support ticket. Please try again or call uown directly for support.';

      EMAIl.send(data, userToken)
        .then(async (res) => {
          try {
            const responseData = await res.json();
            if (res.ok && responseData.success) {
              showToast(
                'success',
                'Successfully submitted your support ticket.',
              );
              resetForm();
            } else {
              showToast('error', responseData.message || errorMessage);
            }
          } catch (error) {
            showToast('error', errorMessage);
          }
        })
        .catch(() => {
          showToast('error', errorMessage);
        });
    },
    validateOnBlur: false,
  });

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa2

---

### **Esquema do Cenário 1: Submissão bem-sucedida de ticket de suporte por tipo de conta e tipo de ticket**

**Objetivo:**
Validar que tickets de suporte são enviados com sucesso e recebidos no Zendesk para **todos os tipos de conta** e **todos os tipos de ticket disponíveis**.

**Dado que**

* existe uma conta válida do tipo `<tipoConta>`
* existe um tipo de ticket válido `<tipoTicket>`
* todos os campos obrigatórios do ticket de suporte foram informados

**Quando**

* um ticket de suporte do tipo `<tipoTicket>` é enviado pelo endpoint `/submitSupportTicket`

**Então**

* a resposta retorna o status **200 OK**
* o corpo da resposta contém `success: true`
* uma mensagem de sucesso é retornada
* um registro é criado na **EmailQueue**
* um registro é criado na **SvActivityLog**
* o ticket/e-mail é recebido no Zendesk para a conta do tipo `<tipoConta>`
* o ticket é roteado corretamente de acordo com o tipo `<tipoTicket>`

**Exemplos:**

| tipoConta   | tipoTicket          |
| ----------- | ------------------- |
| UOWN        | billing/payment inquiry |
| UOWN        | payment_arrangement |
| UOWN        | merchant            |
| UOWN        | other               |
| Kornerstone | billing             |
| Kornerstone | payment_arrangement |
| Kornerstone | merchant            |
| Kornerstone | other               |

---

### **Esquema do Cenário 2: Rejeição de submissão inválida de ticket de suporte por tipo de conta e tipo de ticket**
```markdown
Given existe uma conta válida do tipo `<tipoConta>`
Given existe um tipo de ticket `<tipoTicket>`
When um ticket de suporte do tipo `<tipoTicket>` é enviado pelo endpoint `/submitSupportTicket`
Then a resposta retorna o status **400 Bad Request**
And a resposta **indica falha por erro de validação**
And uma mensagem de erro apropriada é retornada
And nenhum registro é criado na **EmailQueue**
And nenhum registro é criado na **SvActivityLog**
And nenhum stack trace é exposto ao cliente

Exemplos:
| tipoConta   | tipoTicket          |
| ----------- | ------------------- |
| UOWN        | billing             |
| Kornerstone | billing             |
| UOWN        | payment_arrangement |
| Kornerstone | payment_arrangement |
| UOWN        | merchant            |
| Kornerstone | merchant            |
| UOWN        | other               |
| Kornerstone | other               |

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```



**PASS**

---

### **Cenário 3: Uso exclusivo do endpoint correto para envio de ticket**

**Objetivo:**
Validar que o fluxo de envio de tickets utiliza exclusivamente o endpoint correto.

**Então**

* todas as submissões utilizam o endpoint `/uown/svc/submitSupportTicket`
* nenhuma chamada é feita ao endpoint legado `/api/emails/send`
* não ocorre envio direto de e-mail pelo frontend

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in QA2

---
### **Scenario 1: Successful support ticket submission by account type and ticket type**
```markdown
- Given a valid account of type `<accountType>` exists
- And a valid ticket type `<ticketType>` exists
- And all required support ticket fields are provided
- When a support ticket of type `<ticketType>` is submitted through the `/submitSupportTicket` endpoint
- Then the response returns **200 OK**
- And the response body contains `success: true`
- And a success message is returned
- And a record is created in **EmailQueue**
- And a record is created in **SvActivityLog**
- And the ticket/email is received in Zendesk for the `<accountType>` account
- And the ticket is correctly routed according to the `<ticketType>`

Examples:
| accountType | ticketType                |
| ----------- | ------------------------- |
| UOWN        | billing / payment inquiry |
| UOWN        | payment_arrangement       |
| UOWN        | merchant                  |
| UOWN        | other                     |
| Kornerstone | billing                   |
| Kornerstone | payment_arrangement       |
| Kornerstone | merchant                  |
| Kornerstone | other                     |

|    Data    | Value |
|------------|-------|
| LeadPk     | 14634 and 1 |
| AccountPk  | 11176 and 11177 |
```

![Screenshot_at_Jan_26_04-55-30](/uploads/2041eec5aec3ebc06ba760325d3f1018/Screenshot_at_Jan_26_04-55-30.png){width=900 height=47}
![Screenshot_at_Jan_26_04-55-45](/uploads/d69914a66724d3b8bdbe1ea52323c085/Screenshot_at_Jan_26_04-55-45.png){width=900 height=46}
![Screenshot_at_Jan_26_04-59-37](/uploads/b82ed23bec5889c62b396241f8497f1f/Screenshot_at_Jan_26_04-59-37.png){width=597 height=331}
![Screenshot_at_Jan_26_04-59-50](/uploads/668b0a7cc94d74708ecd140451b63f9e/Screenshot_at_Jan_26_04-59-50.png){width=606 height=330}
![Screenshot_at_Jan_26_05-07-19](/uploads/651f4c44b829c7bedc567e925a45b987/Screenshot_at_Jan_26_05-07-19.png){width=900 height=98}
![Screenshot_at_Jan_26_05-11-22](/uploads/925494b3d51c2f7f4d95d6c10e60ca21/Screenshot_at_Jan_26_05-11-22.png){width=900 height=462}
![Screenshot_at_Jan_26_05-15-11](/uploads/8ce0f4b8f3ae994019db205e9aceae4c/Screenshot_at_Jan_26_05-15-11.png){width=900 height=143}
![Screenshot_at_Jan_26_05-15-43](/uploads/67dac291922f11968556492496742d35/Screenshot_at_Jan_26_05-15-43.png){width=900 height=470}

**PASS**

---
### **Scenario 2: Rejection of invalid support ticket submission by account type and ticket type**
```markdown
- Given a valid account of type `<accountType>` exists  
- Given a ticket type `<ticketType>` exists  
- When a support ticket of type `<ticketType>` is submitted through the `/submitSupportTicket` endpoint  
- Then the response returns **400 Bad Request**  
- And the response **indicates failure due to a validation error**  
- And an appropriate error message is returned  
- And no record is created in the **EmailQueue**  
- And no record is created in the **SvActivityLog**  
- And no stack trace is exposed to the client  

Examples:  
| accountType | ticketType          |
| ----------- | ------------------- |
| UOWN        | billing             |
| Kornerstone | billing             |
| UOWN        | payment_arrangement |
| Kornerstone | payment_arrangement |
| UOWN        | merchant            |
| Kornerstone | merchant            |
| UOWN        | other               |
| Kornerstone | other               |

|    Data    | Value |
|------------|-------|
| LeadPk     | 14634 and 1 |
| AccountPk  | 11176 and 11177 |
```
![Screenshot_at_Jan_26_05-23-04](/uploads/cb182e5f16fb2084f618e2be7a4fba20/Screenshot_at_Jan_26_05-23-04.png){width=784 height=600}
![Screenshot_at_Jan_26_05-57-47](/uploads/8aaff737edb514310e14595ff53c1b92/Screenshot_at_Jan_26_05-57-47.png){width=900 height=590}

**PASS**

---
### **Scenario 3: Exclusive use of the correct endpoint for ticket submission**
```markdown
Validate that the ticket submission flow uses only the correct endpoint.
- All submissions use the `/uown/svc/submitSupportTicket` endpoint
- No calls are made to the legacy endpoint `/api/emails/send`
- No direct email sending occurs from the frontend

|    Data    | Value |
|------------|-------|
| LeadPk     | 14634 and 1 |
| AccountPk  | 11176 and 11177 |
```

![image](/uploads/caf02dd209ee8424d976adfd107ebbbb/image.png){width=603 height=359}
![Screenshot_at_Jan_26_04-59-37](/uploads/8a9a1c346fe3335dfb26c4be4d858578/Screenshot_at_Jan_26_04-59-37.png){width=597 height=331}
![Screenshot_at_Jan_26_04-59-50](/uploads/083a4e8894078888582a146379339f9c/Screenshot_at_Jan_26_04-59-50.png){width=606 height=330}

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------




---------------------------------------------------------------------------------------------------------------------------------------------------------